enum AlertPriority {
  Critical = 'P1',
  High = 'P2',
  Moderate = 'P3',
  Low = 'P4',
  Info = 'P5',
}

enum ErrorType {
  InvalidHeaders = 'E1001',
  InvalidToken = 'E1002',
  InvalidJWS = 'E1003',
  MissingRequiredField = 'E1004',
  CatchError = 'E1005',
  BadRequest = 'E1006',
  IpBlocked = 'E1007',
  InvalidIPaddresss = 'E1008',
}

enum SCChallengeStatus {
  None = 0,
  CanBeCreated = 1,
  Betting = 2,
  Awaiting = 3,
  Canceled = 4,
  ResolvedFor = 5,
  ResolvedAgainst = 6,
  ResolvedDraw = 7,
}

const ErrorDetail: { [key in ErrorType]: string } = {
  [ErrorType.InvalidHeaders]: 'Invalid auth info, missing required headers',
  [ErrorType.InvalidToken]: 'Invalid auth token!',
  [ErrorType.InvalidJWS]: 'Invalid JWS',
  [ErrorType.MissingRequiredField]: 'Required fields are missing in the request',
  [ErrorType.CatchError]: 'Error caught in catch block',
  [ErrorType.BadRequest]: 'Bad request',
  [ErrorType.IpBlocked]: 'IP Blocked',
  [ErrorType.InvalidIPaddresss]: 'Tried accessing from Invalid IP address',
}

enum EventCaller {
  Admin = 'admin',
  User = 'user',
  System = 'system',
}

// TODO: to be replaced with @duelnow/constants
enum HttpResponseStatus {
  Ok = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  InternalServerError = 500,
}

enum Sports {
  Basketball = 'Basketball',
  Baseball = 'Baseball',
  MMA = 'MMA',
  Soccer = 'Soccer',
  Football = 'Football',
}

enum GameStatus {
  Scheduled = 'Scheduled',
  InProgress = 'InProgress',
  Closed = 'Closed',
  Postponed = 'Postponed',
  Cancelled = 'Cancelled',
  Interrupted = 'Interrupted',
}

enum BlockchainEvents {
  Transfer = 'Transfer',
}

enum ContractType {
  DuelNowToken = 'Token',
  SportsV1_0_0 = 'SportsV1_0_0',
  SportsV1_0_1 = 'SportsV1_0_1',
}

const GameShortStatusMapping: Record<string, GameStatus> = {
  1: GameStatus.Scheduled,
  2: GameStatus.InProgress,
  3: GameStatus.Closed,
  NS: GameStatus.Scheduled,
  IN1: GameStatus.InProgress,
  IN2: GameStatus.InProgress,
  IN3: GameStatus.InProgress,
  IN4: GameStatus.InProgress,
  IN5: GameStatus.InProgress,
  IN6: GameStatus.InProgress,
  IN7: GameStatus.InProgress,
  IN8: GameStatus.InProgress,
  IN9: GameStatus.InProgress,
  POST: GameStatus.Postponed,
  CANC: GameStatus.Cancelled,
  INTR: GameStatus.Interrupted,
  ABD: GameStatus.Postponed,
  FT: GameStatus.Closed,
  Q1: GameStatus.InProgress,
  Q2: GameStatus.InProgress,
  Q3: GameStatus.InProgress,
  Q4: GameStatus.InProgress,
  OT: GameStatus.InProgress,
  HT: GameStatus.InProgress,
  AOT: GameStatus.Closed,
  PST: GameStatus.Postponed,
  PF: GameStatus.Scheduled,
  TBD: GameStatus.Scheduled,
  '1H': GameStatus.InProgress,
  '2H': GameStatus.InProgress,
  ET: GameStatus.InProgress,
  BT: GameStatus.InProgress,
  P: GameStatus.InProgress,
  SUSP: GameStatus.InProgress,
  INT: GameStatus.InProgress,
  AWD: GameStatus.Cancelled,
  WO: GameStatus.Closed,
  LIVE: GameStatus.InProgress,
  PEN: GameStatus.Closed,
  AET: GameStatus.Closed,
  IN: GameStatus.Scheduled,
  EOR: GameStatus.InProgress,
}

const OtherTeam = {
  apiTeamId: 0,
  name: 'Others',
}

const ZeroAddress = {
  address: '0x0000000000000000000000000000000000000000',
  decimals: 18,
}

const membershipToken = 'DNOW'

enum SignUpMethod {
  email = 'Email',
  google = 'Google',
  x = 'X',
  apple = 'Apple',
  wc = 'WalletConnect',
  mm = 'MetaMask',
  cw = 'Coinbase Wallet',
}

enum CancelReasonCode {
  NoParticipants = 'C0001',
  UserCancellation = 'C0002',
  NoPicks = 'C0003',
  Draw = 'C0004',
  PostponedorCanceled = 'C0005',
}

enum CancelType {
  FullReturn = 1,
  UserPart = 0,
}

const QuarterMapping: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
}

const { SYSTEM_IP: systemIp } = process.env

enum Sources {
  Challenges = 'challenges',
  Users = 'users',
}

export {
  AlertPriority,
  BlockchainEvents,
  CancelReasonCode,
  CancelType,
  ContractType,
  ErrorDetail,
  ErrorType,
  EventCaller,
  GameShortStatusMapping,
  GameStatus,
  HttpResponseStatus,
  OtherTeam,
  QuarterMapping,
  SCChallengeStatus,
  SignUpMethod,
  Sources,
  Sports,
  ZeroAddress,
  membershipToken,
  systemIp,
}
