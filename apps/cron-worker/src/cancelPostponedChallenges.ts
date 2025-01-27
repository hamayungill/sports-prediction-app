import prismaClient, { Prisma } from '@duelnow/database'
import { correlationIdMiddleware } from '@duelnow/logger'
import { CancelReasonCode, GameStatus, delay } from '@duelnow/utils'
import { JsonObject } from 'swagger-ui-express'

import { insertContractDataFeed } from './cancelChallengesToCdf'
import { logger } from './utils'

const { CategoryDepth, TxnStatus } = Prisma
const { challenges, games } = prismaClient

// Cancel Postponed or Canceled Challenges
const cancelPostponedChallenges = async (): Promise<void> => {
  try {
    logger.info('Insert Postponed or Canceled challenges in CDF got triggered.')
    const cancelPostponedData: JsonObject = await challenges.findMany({
      where: {
        processingStatus: TxnStatus.Pending,
        challengeDepth: {
          in: [CategoryDepth.Game, CategoryDepth.Team, CategoryDepth.Player],
        },
        endDate: {
          lt: new Date(),
        },
        games: {
          processingStatus: TxnStatus.Pending,
          OR: [
            {
              data: {
                path: ['status'],
                equals: GameStatus.Cancelled,
              },
            },
            {
              data: {
                path: ['status'],
                equals: GameStatus.Postponed,
              },
            },
          ],
        },
      },
      select: {
        challengeId: true,
        scChallengeId: true,
        challengeDepth: true,
        finalOutcome: true,
        contractId: true,
        gameId: true,
      },
    })

    if (cancelPostponedData && cancelPostponedData.length > 0) {
      await insertContractDataFeed(cancelPostponedData, CancelReasonCode.PostponedorCanceled)

      const gameIds = cancelPostponedData.map((data: JsonObject) => {
        return data.gameId
      })

      await games.updateMany({
        where: {
          gameId: {
            in: gameIds,
          },
        },
        data: {
          processingStatus: TxnStatus.Success,
        },
      })
    }
  } catch (error) {
    logger.error('Insert Postponed or Canceled challenges in CDF error: ', error)
    process.exit(1)
  }
  logger.info('Insert Postponed or Canceled challenges in CDF got stopped.')
  await delay(30000)
  process.exit(0)
}

correlationIdMiddleware({}, null, async () => {
  await cancelPostponedChallenges()
})
