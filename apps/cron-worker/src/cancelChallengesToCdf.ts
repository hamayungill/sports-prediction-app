import prismaClient, { Prisma } from '@duelnow/database'
import { correlationIdMiddleware } from '@duelnow/logger'
import { CancelReasonCode, InsertCDFData, delay } from '@duelnow/utils'
import { JsonObject } from 'swagger-ui-express'

import { logger } from './utils'

const { CdfEvent, ChallengeParticipationStatus, ChallengeStatus, Outcome, TxnStatus } = Prisma
const { challengeParticipations, challengeResults, challenges, contractDataFeed } = prismaClient

// Insert cancel challenges in CDF
const cancelChallengesToCdf = async (): Promise<void> => {
  try {
    logger.info('Insert cancelled challenges in CDF got triggered.')
    const cancelChallengesData: JsonObject = await challenges.findMany({
      where: {
        status: ChallengeStatus.Pending,
        processingStatus: TxnStatus.Pending,
        startDate: {
          lt: new Date(),
        },
      },
      select: {
        challengeId: true,
        scChallengeId: true,
        challengeDepth: true,
        finalOutcome: true,
        contractId: true,
      },
    })

    if (cancelChallengesData && cancelChallengesData.length > 0) {
      await insertContractDataFeed(cancelChallengesData, CancelReasonCode.NoParticipants)
    }
  } catch (error) {
    logger.error('Insert cancelled challenges in CDF error: ', error)
    process.exit(1)
  }
  logger.info('Insert cancelled challenges in CDF got stopped.')
  await delay(30000)
  process.exit(0)
}

// Insert cancel challenges in CDF
const insertContractDataFeed = async (challengesData: JsonObject, reasonCode: string): Promise<void> => {
  const insertData: InsertCDFData[] = []
  const challengeIds: number[] = []

  console.log('-----insertContractDataFeed data------')
  console.log(challengesData)

  await challengesData.forEach((data: JsonObject) => {
    insertData.push({
      challengeId: data.challengeId,
      scChallengeId: data.scChallengeId,
      contractId: data.contractId,
      event: CdfEvent.CancelledOrDraw,
      finalOutcome: Outcome.CancelledOrDraw,
      status: TxnStatus.Pending,
    })
    challengeIds.push(data.challengeId)
  })

  console.log('-----insertContractDataFeed line 1------')
  console.log(challengeIds)

  const insertContractDataFeed = contractDataFeed.createMany({ data: insertData })

  console.log('-----insertContractDataFeed line 2------')

  const updateChallengeStatus = challenges.updateMany({
    where: {
      challengeId: {
        in: challengeIds,
      },
    },
    data: {
      status: ChallengeStatus.Cancelled,
      finalOutcome: Outcome.CancelledOrDraw,
      reasonCode,
      processingStatus: TxnStatus.InProgress,
    },
  })

  console.log('-----insertContractDataFeed line 3------')

  const updateChallengeParticipationsStatus = challengeParticipations.updateMany({
    where: {
      challengeId: {
        in: challengeIds,
      },
    },
    data: {
      status: ChallengeParticipationStatus.Inactive,
    },
  })

  console.log('-----insertContractDataFeed line 4------')

  const updateChallengeResults = challengeResults.updateMany({
    where: {
      challengeId: {
        in: challengeIds,
      },
    },
    data: {
      finalOutcome: Outcome.CancelledOrDraw,
    },
  })

  await prismaClient.$transaction([
    insertContractDataFeed,
    updateChallengeStatus,
    updateChallengeParticipationsStatus,
    updateChallengeResults,
  ])

  logger.info(`Inserted cancelled challengeId ${challengeIds.join()} in CDF.`)
}

correlationIdMiddleware({}, null, async () => {
  await cancelChallengesToCdf()
})

export { insertContractDataFeed }
