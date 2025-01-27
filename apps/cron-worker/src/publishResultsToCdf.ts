import prismaClient, { Prisma } from '@duelnow/database'
import { correlationIdMiddleware } from '@duelnow/logger'
import { InsertCDFData, delay } from '@duelnow/utils'
import { JsonObject } from 'swagger-ui-express'

import { logger } from './utils'

const { CdfEvent, ChallengeStatus, TxnStatus } = Prisma
const { challenges, contractDataFeed } = prismaClient

// Insert published result in CDF
const publishResultsToCdf = async (): Promise<void> => {
  try {
    logger.info('Insert published result in CDF got triggered.')
    const publishResultsList: JsonObject[] = await challenges.findMany({
      where: {
        status: ChallengeStatus.Completed,
        processingStatus: TxnStatus.Pending,
      },
      select: {
        challengeId: true,
        scChallengeId: true,
        challengeDepth: true,
        finalOutcome: true,
        contractId: true,
      },
    })
    if (publishResultsList.length > 0) {
      await insertContractDataFeed(publishResultsList)
    }
    logger.info(`Inserted ${publishResultsList.length | 0} results data in CDF.`)
  } catch (error) {
    logger.error('Insert published result in CDF error: ', error)
    process.exit(1)
  }

  logger.info('Insert published result in CDF got stopped.')
  await delay(30000)
  process.exit(0)
}

// Insert published result in CDF
const insertContractDataFeed = async (challengesData: JsonObject): Promise<void> => {
  const insertData: InsertCDFData[] = []
  const challengeIds: number[] = []

  await challengesData.forEach((data: JsonObject) => {
    insertData.push({
      challengeId: data.challengeId,
      scChallengeId: data.scChallengeId,
      contractId: data.contractId,
      event: CdfEvent.OutcomePublished,
      status: TxnStatus.Pending,
    })
    challengeIds.push(data.challengeId)
  })

  const insertContractDataFeed = contractDataFeed.createMany({ data: insertData })

  const updateChallengeStatus = challenges.updateMany({
    where: {
      challengeId: {
        in: challengeIds,
      },
    },
    data: {
      processingStatus: TxnStatus.InProgress,
    },
  })
  await prismaClient.$transaction([insertContractDataFeed, updateChallengeStatus])
  logger.info(`Inserted challengeId ${challengeIds.join()} in CDF.`)
}

correlationIdMiddleware({}, null, async () => {
  await publishResultsToCdf()
})
