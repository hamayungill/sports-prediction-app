const { DB_URL, KAFKA_REDIS_URL, SC_ADMIN_PRIVATE_KEY } = process.env

const contractType = 'Sport'

const participantScore = 1

enum GroupLogicCode {
  WinningTeam = 'G000001',
  WinningTeamSpread = 'G000002',
  OverUnderTotalScore = 'G000003',
  MmaEndsInSeconds = 'G000004',
  MmaToGoDistance = 'G000005',
  MmaRoundsByDuration = 'G000006',
  MmaEndsInRound = 'G000007',
  WinToNil = 'G000008',
  GameRedCards = 'G000009',
  CorrectScore = 'G000010',
  GameOvertime = 'G000011',
  GameHighestScoringHalf = 'G000012',
  GameHighestScoringQuarter = 'G000013',
  OverUnderTeam = 'T000001',
  HomeOddEven = 'T000002',
  FirstTeamToScore = 'T000003',
  OverUnderPlayer = 'P000001',
  WinByKoTkoDqSubPlayer = 'P000002',
  WinningFighter = 'P000003',
  PlayerRedCards = 'P000004',
  FirstPlayerToScore = 'P000005',
  AnytimeGoalScorer = 'P000006',
  NflFirstPlayerToScore = 'P000007',
}

enum Subgroup {
  Over = 'over',
  Under = 'under',
  Yes = 'yes',
  No = 'no',
  OverOneFive = 'over 1.5',
  UnderOneFive = 'under 1.5',
  OverTwoFive = 'over 2.5',
  UnderTwoFive = 'under 2.5',
}

enum Sport {
  Basketball = 'basketball',
  Baseball = 'baseball',
  MMA = 'mma',
  Football = 'football',
  Soccer = 'soccer',
}

enum ScFinalOutcome {
  Win = 1,
  Lose = 2,
  CancelledOrDraw = 3,
}

enum ResultValues {
  KO = 'ko',
  TKO = 'tko',
  DQ = 'dq',
  SUB = 'sub',
  Main = 'main',
  Points = 'points',
}

enum CorrectScoreAtt {
  halftime = 'halftime',
  fulltime = 'fulltime',
  halftime_home = 'score_halftime_home',
  halftime_away = 'score_halftime_away',
  fulltime_home = 'score_fulltime_home',
  fulltime_away = 'score_fulltime_away',
}

enum BlockChainEvents {
  BetAmountIncreased = 'BetAmountIncreased',
  ChallengeFundsMoved = 'ChallengeFundsMoved',
  ChallengeJoined = 'ChallengeJoined',
  UserWithdrawn = 'UserWithdrawn',
  AdminReceived = 'AdminReceived',
  ReferralsEarned = 'ReferralsEarned',
  AdminWithdrawn = 'AdminWithdrawn',
  AdminShareRulesUpdated = 'AdminShareRulesUpdated',
  ChallengeCreated = 'ChallengeCreated',
  TokenAllowed = 'TokenAllowed',
  ChallengeResolved = 'ChallengeResolved',
}

export {
  BlockChainEvents,
  CorrectScoreAtt,
  DB_URL,
  GroupLogicCode,
  KAFKA_REDIS_URL,
  ResultValues,
  SC_ADMIN_PRIVATE_KEY,
  ScFinalOutcome,
  Sport,
  Subgroup,
  contractType,
  participantScore,
}
