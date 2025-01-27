/* eslint-disable  @typescript-eslint/no-explicit-any */
import prismaClient, { Prisma } from '@duelnow/database'
import { correlationIdMiddleware } from '@duelnow/logger'
import { delay } from '@duelnow/utils'
import { JsonObject } from 'swagger-ui-express'

import { calculateResultsByLogicCode } from './calculateGroup'
import { calculateLeaderboard, calculatePickemPoints } from './calculatePickemResults'
import { logger } from './utils'
import { Sport } from './utils/const'
const { ChallengeStatus, TxnStatus } = Prisma
const { challenges, games, gamesStats } = prismaClient

// Result updates on each challenge
const calculateResults = async (): Promise<void> => {
  try {
    logger.info('calculate result got triggered.')
    const gamesStatsData = await gamesStats.findFirst({
      where: {
        gameStats: {
          path: ['status'],
          equals: 'Closed',
        },
        games: {
          AND: [
            {
              OR: [
                {
                  processingStatus: TxnStatus.Pending,
                },
                {
                  processingStatus: TxnStatus.InProgress,
                },
              ],
            },
            {
              OR: [
                {
                  challenges: {
                    some: {},
                  },
                },
                {
                  pickemChallengeLineups: {
                    some: {},
                  },
                },
              ],
            },
          ],
        },
      },
      select: {
        gameStats: true,
        games: {
          select: {
            gameId: true,
            processingStatus: true,
            gamesStats: {
              select: {
                gameStats: true,
              },
            },
            teamsStats: {
              select: {
                teamStats: true,
                teams: {
                  select: {
                    teamId: true,
                  },
                },
              },
            },
            playersStats: {
              select: {
                playerStats: true,
                players: {
                  select: {
                    apiPlayerId: true,
                    playerId: true,
                  },
                },
              },
            },
            challenges: {
              where: {
                status: ChallengeStatus.InProgress,
              },
              select: {
                challengeId: true,
                scChallengeId: true,
                status: true,
                gameId: true,
                teamId: true,
                teams: {
                  select: {
                    apiTeamId: true,
                  },
                },
                playerId: true,
                Players: {
                  select: {
                    apiPlayerId: true,
                  },
                },
                contractId: true,
                contracts: {
                  select: {
                    contractAddress: true,
                    abiFile: true,
                    networks: {
                      select: {
                        name: true,
                        networkId: true,
                      },
                    },
                  },
                },
                challengeResults: {
                  select: {
                    challengeResultId: true,
                    participantStatP1: true,
                    participantStatP2: true,
                    statAttribute: true,
                    challengeParticipations: {
                      select: {
                        participantRole: true,
                      },
                    },
                    category: {
                      select: {
                        categoryId: true,
                        categoryApiTitle: true,
                      },
                    },
                    groups: {
                      select: {
                        groupId: true,
                        groupApiTitle: true,
                        logicCode: true,
                      },
                    },
                    subgroups: {
                      select: {
                        subgroupId: true,
                        subgroupApiTitle: true,
                      },
                    },
                    sport: {
                      select: {
                        sportName: true,
                        sportId: true,
                      },
                    },
                  },
                },
              },
            },
            pickemChallengeLineups: {
              where: {
                OR: [{ processingStatus: null }, { processingStatus: TxnStatus.Pending }],
              },
              select: {
                id: true,
                challengeId: true,
                pickTeamId: true,
                pickStatus: true,
                spreadPoints: true,
                challengeResults: {
                  select: {
                    challengeId: true,
                    challengeResultId: true,
                    totalScore: true,
                    spreadPoints: true,
                    participantStatP1: true,
                    differenceP1: true,
                  },
                },
                challenges: {
                  select: {
                    pickemScoreMode: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'asc',
      },
    })

    logger.info('gamesStatsData')
    logger.info(gamesStatsData)
    if (gamesStatsData) {
      await calculateEachResults(gamesStatsData)
      logger.info(`calculate result for gameId ${gamesStatsData.games.gameId} has been completed.`)
    }
  } catch (error) {
    logger.error('calculate result error: ', error)
    process.exit(1)
  }
  logger.info('calculate result got stopped.')
  await delay(60000)
  process.exit(0)
}

// calculate results based on challenge depth
const calculateEachResults = async (resultData: JsonObject): Promise<void> => {
  let pickemChallengeIds: number[] = []
  const failedChallengeIds: number[] = []
  let leaderboardTransaction: JsonObject[] = []
  const gameTransaction: JsonObject[] = []
  let getCreatorData

  try {
    //calculate pickem results
    if (resultData.games.pickemChallengeLineups && resultData.games.pickemChallengeLineups.length > 0) {
      pickemChallengeIds = await calculatePickemPoints(resultData)
    }
    if (resultData.games.challenges && resultData.games.challenges.length > 0) {
      const promises = resultData.games.challenges.map(async (challengeData: JsonObject) => {
        getCreatorData = [...challengeData.challengeResults]
        getCreatorData = await getCreatorData.sort((a, b) => a.challengeResultId - b.challengeResultId)[0]

        if (
          challengeData.challengeResults[0]?.sport?.sportName.toLowerCase() === Sport.Baseball ||
          challengeData.challengeResults[0]?.sport?.sportName.toLowerCase() === Sport.Basketball ||
          challengeData.challengeResults[0]?.sport?.sportName.toLowerCase() === Sport.MMA ||
          challengeData.challengeResults[0]?.sport?.sportName.toLowerCase() === Sport.Football ||
          challengeData.challengeResults[0]?.sport?.sportName.toLowerCase() === Sport.Soccer
        ) {
          logger.info(`calculate result for challengeId: ${challengeData.challengeId}.`)
          return calculateResultsByLogicCode(
            challengeData,
            resultData,
            getCreatorData,
            gameTransaction,
            failedChallengeIds,
          )
        }
      })
      await Promise.all(promises)
    }

    if (pickemChallengeIds.length > 0) {
      leaderboardTransaction = await calculateLeaderboard(pickemChallengeIds)
    }

    const updateChallengeStatus: any = challenges.updateMany({
      where: {
        gameId: resultData.games.gameId,
        status: ChallengeStatus.InProgress,
        challengeId: {
          notIn: failedChallengeIds,
        },
      },
      data: {
        status: ChallengeStatus.Completed,
      },
    })
    const updateGamesProcessingStatus = games.update({
      where: {
        gameId: resultData.games.gameId,
      },
      data: {
        processingStatus: TxnStatus.Success,
      },
    })
    await prismaClient.$transaction([
      updateChallengeStatus,
      updateGamesProcessingStatus,
      ...leaderboardTransaction,
      ...gameTransaction,
    ])
  } catch (error) {
    logger.error('Transaction failed', error)
    throw error
  }
}

correlationIdMiddleware({}, null, async () => {
  await calculateResults()
})
