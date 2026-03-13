function countClaimedByRole(): TakenSpots {
    const params = getParameters()
    const claimedSpots = getAllStates().map(stateToFsm).filter(s => s.claimsSpot)
    const numLeaders = claimedSpots.filter(s => s.stateRow.role === "Leader").length
    const numFollowers = claimedSpots.filter(s => s.stateRow.role === "Follower").length
    const numTotal = claimedSpots.length
    return {
        leaders: numLeaders + params.leaderBias,
        followers: numFollowers + params.followerBias,
        total: numTotal + params.leaderBias + params.followerBias
    }
}

function countClaimedByRoleByPass(pass: WsPass): TakenSpots {
    const params = getParameters()
    const claimedPerPass = getAllStates().map(stateToFsm).filter(s => s.claimsSpot).filter(s => s.stateRow.pass === pass)
    const numLeaders = claimedPerPass.filter(s => s.stateRow.role === "Leader").length
    const numFollowers = claimedPerPass.filter(s => s.stateRow.role === "Follower").length
    const numTotal = claimedPerPass.length
    return {
        leaders: numLeaders + params.leaderBias,
        followers: numFollowers + params.followerBias,
        total: numTotal + params.leaderBias + params.followerBias
    }
}

function countFreeSpots(): number {
    const params = getParameters()
    const { leaders, followers, total } = countClaimedByRole()
    return params.maxParticipants - total
}

function countFreePassSpots(pass: WsPass): number {
    const params = getParameters()
    const { leaders, followers, total } = countClaimedByRoleByPass(pass)
    return params.maxParticipantsPerPass[pass] - total
}

function wontBreakBalance(role: Role): boolean {
    if (role === "Party") {
        return true
    }
    const params = getParameters()
    const { leaders, followers, total } = countClaimedByRole()
    if (role === "Leader") {
        return leaders < params.noBalanceThreshold ? true : (leaders + 1) < (followers * params.maxImbalance)
    } else {
        return followers < params.noBalanceThreshold ? true : (followers + 1) < (leaders * params.maxImbalance)
    }
}

function wontBreakPassBalance(role: Role, pass: WsPass): boolean {
    if (role === "Party") {
        return wontBreakBalance(role)
    }
    const params = getParameters()
    const { leaders, followers, total} = countClaimedByRoleByPass(pass)
    if (role === "Leader") {
        return leaders < params.noBalanceThreshold ? true : (leaders + 1) < (followers * params.maxImbalance)
    } else {
        return followers < params.noBalanceThreshold ? true : (followers + 1) < (leaders * params.maxImbalance)
    }
}

function canAdmit(role: Role): boolean {
    Logger.log("checking if we can admit one more " + role)
    const freeSpots = countFreeSpots()
    const spotLeft = freeSpots > 0
    const balanceOk = wontBreakBalance(role)
    Logger.log(`free spots: ${freeSpots}, wontBreakBalance: ${balanceOk}`)
    return (spotLeft && balanceOk)
}

function canAdmitPass(role: Role, pass: WsPass): boolean {
    Logger.log("checking if we can admit one more " + role)
    const freeSpots = Math.min(countFreePassSpots(pass), countFreeSpots())
    const spotLeft = freeSpots > 0
    const balanceOk = wontBreakPassBalance(role, pass)
    Logger.log(`free spots: ${freeSpots}, wontBreakPassBalance: ${balanceOk}`)
    return (spotLeft && balanceOk)
}

function evaluateNewState(fsm: NewState | WaitingListState): FsmState {
    Logger.log("Evaluating new/waiting list state", fsm, fsm.stateRow)

    const mentionedPartners = () => getAllFsms()
        .filter(s => s.stateName == "PARTNER_SIGNUP")
        .map(s => s.stateRow.partner)

    if (mentionedPartners().includes(fsm.stateRow.firstname + " " + fsm.stateRow.lastname)) {
        return new PartnerSignupState(fsm.stateRow)
    }
    else if (canAdmitPass(fsm.stateRow.role, fsm.stateRow.pass)) {
        return new AwaitingPaymentState(fsm.stateRow)
    }
    else if (fsm.stateRow.partner && Math.min(countFreePassSpots(fsm.stateRow.pass), countFreeSpots()) > 1) {
        return new PartnerSignupState(fsm.stateRow)
    }
    else {
        return new WaitingListState(fsm.stateRow)
    }
}

interface FsmState {
    stateName: State
    claimsSpot: boolean
    stateRow: StateRow
    save: () => void
    cancel: () => void
}

abstract class BaseState implements FsmState {
    abstract stateName: State
    abstract claimsSpot: boolean
    stateRow: StateRow
    save = () => {
        Logger.log("Saving", this)
        writeStateRow({
            ...this.stateRow,
            state: this.stateName
        })
    }
    cancel = () => {
        Logger.log("Cancelled", this)
        new CancelledState({
            ...this.stateRow,
            cancelled: true
        }).save()
        sendEmail(
            this.stateRow.email,
            emailTitle("Cancellation"),
            cancellationBody(this.stateRow.firstname)
        )
    }

    constructor(rawData: StateRow) {
        this.stateRow = rawData
    }
}

class NewState extends BaseState {
    stateName = "NEW" as State
    claimsSpot = false

    evaluate = () => {
        Logger.log("Initial evaluation", this, this.stateRow)
        const newState = evaluateNewState(this)
        Logger.log("New state", newState)
        if (newState.stateName == "PARTNER_SIGNUP") {
            const personClaimsPartner = !!newState.stateRow.partner
            if (personClaimsPartner) {
                sendEmail(
                    this.stateRow.email,
                    emailTitle("Partner confirmation"),
                    partnerSignupBody(this.stateRow.firstname)
                )
            } else {
                // This person's name was listed as someone else's partner.
                // Hold it for manual processing.
            }
            sendEmail(
                adminEmailAddress,
                emailTitle("Manual intervention required"),
                JSON.stringify(newState)
            )
        }
        if (newState.stateName == "WAITING_LIST") {
            sendEmail(
                this.stateRow.email,
                emailTitle("Waiting list"),
                waitingListBody(this.stateRow.firstname)
            )
        }
        if (newState.stateName == "AWAITING_PAYMENT") {
            sendEmail(
                this.stateRow.email,
                emailTitle("Payment information"),
                paymentInfoBody(this.stateRow.firstname, this.stateRow.price, this.stateRow.role)
            )
        }
        newState.save()
        return newState
    }
}


const confirmPartner = (fsm: FsmState) => {
    Logger.log("Partner confirmed", fsm)
    const newState = new AwaitingPaymentState(fsm.stateRow)
    sendEmail(
        fsm.stateRow.email,
        emailTitle("Payment information"),
        paymentInfoAfterPartnerBody(fsm.stateRow.firstname, fsm.stateRow.price, fsm.stateRow.role)
    )
    newState.save()
}

class PartnerSignupState extends BaseState {
    stateName = "PARTNER_SIGNUP" as State
    claimsSpot = true
    partnerConfirmed = () => confirmPartner(this)

}

class WaitingListState extends BaseState {
    stateName = "WAITING_LIST" as State
    claimsSpot = false

    partnerConfirmed = () => confirmPartner(this)

    reevaluate = () => {
        Logger.log("Reevaluating waiting list", this)
        const newState = evaluateNewState(this)
        if (newState.stateName == "AWAITING_PAYMENT") {
            sendEmail(
                this.stateRow.email,
                emailTitle("Payment information"),
                paymentInfoAfterWaitingBody(this.stateRow.firstname, this.stateRow.price, this.stateRow.role)
            )
        }
        newState.save()
        return newState
    }
}

class AwaitingPaymentState extends BaseState {
    stateName = "AWAITING_PAYMENT" as State
    claimsSpot = true

    acknowledgePayment = () => {
        Logger.log("Payment confirmed", this)
        const newState = new ConfirmedState(this.stateRow)
        sendEmail(
            this.stateRow.email,
            emailTitle("Registration complete"),
            paymentConfirmationBody(this.stateRow.firstname)
        )
        newState.save()
    }
}

class CancelledState extends BaseState {
    stateName = "CANCELLED" as State
    claimsSpot = false
}

class ConfirmedState extends BaseState {
    stateName = "CONFIRMED" as State
    claimsSpot = true
}

function stateToFsm(state: StateRow): FsmState {
    switch (state.state) {
        case "NEW": return new NewState(state)
        case "PARTNER_SIGNUP": return new PartnerSignupState(state)
        case "WAITING_LIST": return new WaitingListState(state)
        case "AWAITING_PAYMENT": return new AwaitingPaymentState(state)
        case "CANCELLED": return new CancelledState(state)
        case "CONFIRMED": return new ConfirmedState(state)
    }
}