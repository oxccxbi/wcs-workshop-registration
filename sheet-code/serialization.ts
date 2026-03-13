function parseAnswerRow(row: string[]): SignupRow | undefined {
    try {
        const [timestamp, email, firstname, lastname, membership, pass, role, partner] = row;

        return {
            timestamp: timestamp as unknown as Date,
            email: email,
            firstname: firstname,
            lastname: lastname,
            membership: membership,
            pass: pass,
            role: role,
            partner: partner
        };
    } catch (error) {
        Logger.log(error)
        return undefined
    }
}

function parseStateRow(row: any[]): StateRow | undefined {
    try {
        const [timestamp, email, firstname, lastname, membership, pass, role, partner, price,
            state, partnerConfirmed, paymentConfirmed, cancelled, note, reevaluate] = row;
        return {
            timestamp, email, firstname, lastname, membership, pass, role, price,
            partner, partnerConfirmed, state, paymentConfirmed, cancelled, note, reevaluate
        }
    } catch (error) {
        Logger.log(error)
        return undefined
    }
}

function computePrice(membership: Membership, pass: WsPass): number {
    switch (membership) {
        case "Member":
            switch (pass) {
                case "LEVEL_1": return 300;
                case "LEVEL_2": return 350;
                case "PARTY_1": return 50;
                case "PARTY_2": return 85;
            }
            break;
        case "Student":
            switch (pass) {
                case "LEVEL_1": return 400;
                case "LEVEL_2": return 450;
                case "PARTY_1": return 50;
                case "PARTY_2": return 85;
            }
            break;
        case "Regular":
            switch (pass) {
                case "LEVEL_1": return 700;
                case "LEVEL_2": return 750;
                case "PARTY_1": return 100;
                case "PARTY_2": return 170;
            }
            break;
    }
}

function signupToState(signup: SignupRow): StateRow {
    const parsePass = (rawPass: string) => {
        if (!(rawPass in passNameToType)) throw new Error(`Invalid pass: ${rawPass}`);
        return passNameToType[rawPass] as WsPass;
    }

    const parseRole =(rawRole: string= "") => {
        return (rawRole === "") ? "Party" : rawRole as Role;
    }

    const pass = parsePass(signup.pass)
    const role = parseRole(signup.role);
    const membership = signup.membership as Membership;

    return {
        timestamp: signup.timestamp.toISOString(),
        email: signup.email,
        firstname: signup.firstname,
        lastname: signup.lastname,
        membership: membership,
        pass: pass,
        role: role,
        partner: signup.partner,
        price: computePrice(membership, pass),
        state: "NEW",
        partnerConfirmed: false,
        paymentConfirmed: false,
        cancelled: false,
        note: "",
        reevaluate: false,
    }
}

function insertCheckBoxes() {
    const sheet = sheets.state()
    const numRows = sheet.getDataRange().getNumRows()
    sheet.getRange(`K2:M${numRows}`).insertCheckboxes()
    sheet.getRange(`O2:O${numRows}`).insertCheckboxes()
}

function rowifyState(obj: StateRow) {
    const { timestamp, email, firstname, lastname, membership, pass, role, partner, price,
        state, partnerConfirmed, paymentConfirmed, note } = obj
    const stateRow = [timestamp, email, firstname, lastname, membership, pass, role, partner, price,
        state, partnerConfirmed, paymentConfirmed, note]
    return stateRow
}

function writeStateRow(obj: StateRow) {
    const stateRow = rowifyState({
        ...obj,
        reevaluate: false,
    })

    const stateSheet = sheets.state();
    const rowNumber = stateSheet.getDataRange().getValues()
        .findIndex(row => row[0] == obj.timestamp && row[1] === obj.email);

    Logger.log("Row index: " + rowNumber);
    if (rowNumber === -1) {
        stateSheet.appendRow(stateRow);
        insertCheckBoxes()
    } else {
        const i = rowNumber + 1
        stateSheet.getRange(`A${i}:M${i}`).setValues([stateRow]);
    }
}

function appendStateRow(row: StateRow) {
    const stateRow = rowifyState(row)
    sheets.state().appendRow(stateRow)
    insertCheckBoxes()
}

function getState(rowNumber: number): FsmState | undefined {
    logSheet(`Loading state row ${rowNumber}`)
    const rawRow = sheets.state().getDataRange().getValues()[rowNumber - 1]
    const parsedState = parseStateRow(rawRow);
    logSheet(`State row ${rowNumber}: ${JSON.stringify(parsedState)}`)
    return parsedState && stateToFsm(parsedState)
}