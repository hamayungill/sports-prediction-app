/* eslint-disable  @typescript-eslint/no-explicit-any */
import prismaClient, { Prisma } from '@duelnow/database'
import { correlationIdMiddleware } from '@duelnow/logger'
import { GameStatus, delay } from '@duelnow/utils'

import { logger } from './utils'
const { TxnStatus } = Prisma
const { games, gamesStats } = prismaClient

const updateNonChallengeGameStatus = async (): Promise<void> => {
  try {
    logger.info('update games processing status from Pending to Success got triggered.')
    const gamesData = await gamesStats.findMany({
      where: {
        OR: [
          {
            gameStats: {
              path: ['status'],
              equals: 'Closed',
            },
          },
          {
            gameStats: {
              path: ['status'],
              equals: GameStatus.Cancelled,
            },
          },
          {
            gameStats: {
              path: ['status'],
              equals: GameStatus.Postponed,
            },
          },
        ],
        games: {
          processingStatus: TxnStatus.Pending,
          challenges: {
            none: {},
          },
          pickemChallengeLineups: {
            none: {},
          },
        },
      },
      select: {
        apiGameId: true,
        games: {
          select: {
            gameId: true,
          },
        },
      },
      take: 50,
    })

    if (gamesData && gamesData.length > 0) {
      const gameIds = gamesData.map((data) => {
        return data.games.gameId
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
      logger.info(`updated games processing status from Pending to Success.`, gameIds)
    }
  } catch (error) {
    logger.error('update games processing status from Pending to Success error: ', error)
    process.exit(1)
  }

  logger.info('update games processing status from Pending to Success got stopped.')
  await delay(30000)
  process.exit(0)
}

correlationIdMiddleware({}, null, async () => {
  await updateNonChallengeGameStatus()
})
