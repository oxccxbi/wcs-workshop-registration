interface SignupRow {
  // Tidsmerke	E-postadresse	First name   Last name	Membership	Workshop pass (class/level/party)	Role	Partner's name (optional)
  timestamp: Date,
  email: string,
  firstname: string,
  lastname: string,
  membership: string,
  pass: string,
  role: string,
  partner?: string,
}

interface StateRow {
  timestamp: string
  email: string
  firstname: string
  lastname: string
  membership: Membership
  pass: WsPass
  role: Role
  partner: string | undefined
  price: number
  state: State
  partnerConfirmed: boolean
  paymentConfirmed: boolean
  cancelled: boolean
  note: string
  reevaluate: boolean
}

type Role = "Leader" | "Follower"

type State = "NEW"
  | "PARTNER_SIGNUP"
  | "WAITING_LIST"
  | "AWAITING_PAYMENT"
  | "CANCELLED"
  | "CONFIRMED"

type WsPass = "LEVEL_1" | "LEVEL_2"

const passNameToType: Record<string, WsPass> = {
  "Level 1": "LEVEL_1",
  "Level 2": "LEVEL_2"
}

type Membership = "Member" | "Regular"

interface EventParameters {
  maxImbalance: number,
  maxParticipants: number,
  leaderBias: number,
  followerBias: number,
}

interface TakenSpots {
  leaders: number,
  followers: number,
}

type ChangeEvent = "PAYMENT_RECEIVED"
  | "PARTNER_CONFIRMED"
  | "CANCELLED"
  | "EVALUATE"