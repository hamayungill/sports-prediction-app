import prismaClient, { Prisma } from '@duelnow/database'
import { correlationIdMiddleware } from '@duelnow/logger'
import { delay } from '@duelnow/utils'
import { JsonObject } from 'swagger-ui-express'

import { logger } from './utils'

const { ChallengeStatus } = Prisma
const { challenges } = prismaClient

// update challenge status from ready to InProgress
const updateChallengeStatus = async (): Promise<void> => {
  try {
    logger.info('update challenge status from ready to InProgress got triggered.')
    const UpdateChallengeStatusData: JsonObject = await challenges.updateMany({
      where: {
        status: ChallengeStatus.Ready,
        startDate: {
          lt: new Date(),
        },
      },
      data: {
        status: ChallengeStatus.InProgress,
      },
    })
    logger.info(`updated ${UpdateChallengeStatusData.count} challenge status from ready to inProgress.`)
  } catch (error) {
    logger.error('update challenge status from ready to InProgress error: ', error)
    process.exit(1)
  }

  logger.info('update challenge status from ready to InProgress got stopped.')
  await delay(30000)
  process.exit(0)
}

correlationIdMiddleware({}, null, async () => {
  await updateChallengeStatus()
})
