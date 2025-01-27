/* eslint-disable  @typescript-eslint/no-explicit-any */
import { Prisma } from '@duelnow/database'

interface ChallengeResultsData {
  challengeResultId: number
}

interface GetGamesResp {
  games: any
  count: number
}

interface ServiceResponse {
  data: any
  count: number
}

interface WeekGameData {
  gameId: number
  startDate: Date | string
  endDate: Date | string
}

type ChallengesInclude = Prisma.Prisma.ChallengesGetPayload<{
  include: {
    sport: {
      select: {
        sportName: true
      }
    }
    challengeResults: {
      select: {
        category: {
          select: {
            categoryApiTitle: true
          }
        }
        participantOutcome: true
      }
    }
    challengeParticipations: {
      select: {
        contracts: {
          select: {
            tokenName: true
            networks: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }
  }
}>

type challengeParticipationsInclude = Prisma.Prisma.ChallengeParticipationsGetPayload<{
  include: {
    contracts: {
      select: {
        tokenName: true
        networks: {
          select: {
            name: true
          }
        }
      }
    }
    challenges: {
      select: {
        sport: {
          select: {
            sportName: true
          }
        }
        challengeMode: true
        challengeType: true
      }
    }
    challengeResults: {
      select: {
        category: {
          select: {
            categoryApiTitle: true
          }
        }
        participantOutcome: true
      }
    }
  }
}>

export type {
  ChallengeResultsData,
  ChallengesInclude,
  GetGamesResp,
  ServiceResponse,
  WeekGameData,
  challengeParticipationsInclude,
}
