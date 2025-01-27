// eslint-disable-next-line turbo/no-undeclared-env-vars
const { ENABLE_SWAGGER, PORT = 8002, NODE_ENV: environment } = process.env

enum ChallengeFormat {
  Group = 'Group',
  OneVOne = '1v1',
  OneVGroup = '1vGroup',
}

enum Pickem {
  Day = "Daily Pick'em",
  Week = "Weekly Pick'em",
}

const cancelChallengeError = 'Unable to cancel the challenge due to one of the conditions not being met.'

const challengeIdError = 'Invalid Challenge ID'

const createChallengeError = 'The game has already started'

const winCriteriaError = 'The win criteria should be a number greater than 0 and less than or equal to 3.'

const inviteCodeLength = 6

const joinChallengeError = 'The challenge has already started'

const picksError = 'You cannot edit picks while the challenge is in progress.'

const upsertLineupError = 'Invalid Team ID'

const partialStakeLimit = 0

const overUnderError = 'Over Under should be greater than 0.5'

enum Category {
  OverUnder = 'over/under',
}

export {
  Category,
  ChallengeFormat,
  ENABLE_SWAGGER,
  PORT,
  Pickem,
  cancelChallengeError,
  challengeIdError,
  createChallengeError,
  environment,
  inviteCodeLength,
  joinChallengeError,
  overUnderError,
  partialStakeLimit,
  picksError,
  upsertLineupError,
  winCriteriaError,
}
