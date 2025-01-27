import prismaClient, { Prisma } from '@duelnow/database'
import { correlationIdMiddleware } from '@duelnow/logger'
import { EVENTS, delay } from '@duelnow/utils'
import { resolveChallenge } from '@duelnow/web3'
import { JsonObject } from 'swagger-ui-express'

import { ScFinalOutcome, logger, sendEventToWorker, sendProcessingAlert } from './utils'
import { ChallengeFundsMoved } from './utils/types'

const { CategoryDepth, CdfEvent, ChallengeParticipationStatus, Outcome, TxnStatus } = Prisma
const { challengeParticipations, challenges, contractDataFeed } = prismaClient

// Publish Results To Sc
const publishResultsToSc = async (): Promise<void> => {
  try {
    logger.info('Publish results to SC got triggered.')
    const publishResultsData: JsonObject | null = await contractDataFeed.findFirst({
      where: {
        status: TxnStatus.Pending,
        event: CdfEvent.OutcomePublished,
        challenges: {
          OR: [
            {
              challengeDepth: CategoryDepth.Game,
            },
            {
              challengeDepth: CategoryDepth.Team,
            },
            {
              challengeDepth: CategoryDepth.Player,
            },
          ],
        },
      },
      select: {
        challengeId: true,
        scChallengeId: true,
        execCount: true,
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
        challenges: {
          select: {
            challengeResults: {
              select: {
                finalOutcome: true,
              },
            },
            challengeParticipations: {
              select: {
                contracts: {
                  select: {
                    contractAddress: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (publishResultsData) {
      if (publishResultsData.execCount >= 2) {
        const message = `**URGENT** Challenge stuck in 'Processing Status' - Total Retries: ${publishResultsData.execCount - 1} Inception_Challenge_Id: ${publishResultsData.challengeId}`
        const messageData: JsonObject = {
          challengeId: publishResultsData.challengeId,
          scChallengeId: publishResultsData.scChallengeId,
          networkName: publishResultsData.contracts.networks.name,
          contractAddress: publishResultsData.contracts.contractAddress,
          tokenAddress: publishResultsData.challenges.challengeParticipations[0].contracts.contractAddress,
        }
        await sendProcessingAlert(message, EVENTS.ALERT.RESULTS_TO_SC_PUBLISHED, messageData)
        logger.info(`Message sent to alert-worker`)
      }

      await contractDataFeed.updateMany({
        where: {
          challengeId: publishResultsData.challengeId,
          event: CdfEvent.OutcomePublished,
        },
        data: {
          execCount: publishResultsData.execCount ? publishResultsData.execCount + 1 : 1,
        },
      })

      let finalOutcome: number
      switch (publishResultsData.challenges.challengeResults[0].finalOutcome) {
        case Outcome.Win:
          finalOutcome = ScFinalOutcome.Win
          break
        case Outcome.Lose:
          finalOutcome = ScFinalOutcome.Lose
          break
        case Outcome.CancelledOrDraw:
          finalOutcome = ScFinalOutcome.CancelledOrDraw
          break
        default:
          finalOutcome = 0
          break
      }
      console.log('--------line 3----------')
      const publishResultResponse: ChallengeFundsMoved[] | null = await resolveChallenge(
        [publishResultsData.scChallengeId],
        [finalOutcome],
        publishResultsData.contracts.networks.name,
        publishResultsData.contracts.contractAddress,
        publishResultsData.challengeId,
        publishResultsData.challenges.challengeParticipations[0].contracts.contractAddress,
        publishResultsData.contracts.abiFile,
      )
      console.log('--------line 10----------')
      console.log('publishResultResponse:: ')
      console.log(publishResultResponse)
      if (publishResultResponse && publishResultResponse?.length > 0) {
        console.log('--------line 11----------')
        await updateScResponse(publishResultsData, publishResultResponse)
        console.log('--------line 12----------')
        logger.info(`Published challengeId ${publishResultsData.challengeId} results to SC.`)
      }
    }
    console.log('--------line 13----------')
    logger.info('Publish results to SC got stopped.')
  } catch (error) {
    logger.error('Publish results to SC error: ', error)
    process.exit(1)
  }

  // Delay 60 seconds to send alert before exit
  await delay(60000)
  process.exit(0)
}

// Update smartcontract response
const updateScResponse = async (publishResultsData: JsonObject, publishResultResponse: JsonObject[]): Promise<void> => {
  let winnerPromises = []
  let loserPromises = []
  const eventsData: { challengeId: number; paidWalletAddress: string; outcome: string }[] = []

  if (publishResultResponse[0].winners.length > 0) {
    winnerPromises = await publishResultResponse[0].winners.map((data: string, index: number) => {
      eventsData.push({
        challengeId: publishResultsData.challengeId,
        paidWalletAddress: data,
        outcome: EVENTS.BET.WON,
      })
      return challengeParticipations.updateMany({
        where: {
          challengeId: publishResultsData.challengeId,
          paidWalletAddress: data,
        },
        data: {
          participationWinLossQty: publishResultResponse[0].winnersProfit[index],
          participationWinLossUsd: publishResultResponse[0].winnersProfitInUSD[index],
          status: ChallengeParticipationStatus.Inactive,
        },
      })
    })
  }

  if (publishResultResponse[0].losers.length > 0) {
    loserPromises = await publishResultResponse[0].losers.map((data: string, index: number) => {
      eventsData.push({
        challengeId: publishResultsData.challengeId,
        paidWalletAddress: data,
        outcome: EVENTS.BET.LOST,
      })
      return challengeParticipations.updateMany({
        where: {
          challengeId: publishResultsData.challengeId,
          paidWalletAddress: data,
        },
        data: {
          participationWinLossQty: publishResultResponse[0].losersLoss[index],
          participationWinLossUsd: publishResultResponse[0].losersLossInUSD[index],
          status: ChallengeParticipationStatus.Inactive,
        },
      })
    })
  }

  const updateChallengeStatus = challenges.update({
    where: {
      challengeId: publishResultsData.challengeId,
    },
    data: {
      finalOutcome: publishResultsData.challenges.challengeResults[0].finalOutcome,
      processingStatus: TxnStatus.Success,
    },
  })

  const contractDataFeedStatus = contractDataFeed.updateMany({
    where: {
      challengeId: publishResultsData.challengeId,
      event: CdfEvent.OutcomePublished,
    },
    data: {
      finalOutcome: publishResultsData.challenges.challengeResults[0].finalOutcome,
      status: TxnStatus.Success,
    },
  })
  await prismaClient.$transaction([...winnerPromises, ...loserPromises, updateChallengeStatus, contractDataFeedStatus])

  for (const eachEvent of eventsData) {
    sendEventToWorker(eachEvent.challengeId, eachEvent.paidWalletAddress, eachEvent.outcome)
  }
}

correlationIdMiddleware({}, null, async () => {
  await publishResultsToSc()
})
