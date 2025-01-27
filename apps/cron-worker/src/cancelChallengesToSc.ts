import prismaClient, { Prisma } from '@duelnow/database'
import { IKafkaMessage } from '@duelnow/kafka-client'
import { correlationIdMiddleware, getCorrelationId } from '@duelnow/logger'
import { CancelReasonCode, CancelType, EVENTS, Sources, TOPICS, delay, getSystemIp } from '@duelnow/utils'
import { cancelChallenge } from '@duelnow/web3'
import { JsonObject } from 'swagger-ui-express'

import { logger, producer, sendProcessingAlert, updateCanceledWinLoss } from './utils'
import { ChallengeFundsMoved } from './utils/types'

const { CdfEvent, TxnStatus } = Prisma
const { challenges, contractDataFeed, challengeParticipations } = prismaClient

// send cancel challenges to SC
const cancelChallengesToSc = async (): Promise<void> => {
  try {
    logger.info('Send cancelled challenges to SC got triggered.')
    const cancelChallengesData: JsonObject | null = await contractDataFeed.findFirst({
      where: {
        status: TxnStatus.Pending,
        event: CdfEvent.CancelledOrDraw,
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
            reasonCode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (cancelChallengesData) {
      const cancelType =
        cancelChallengesData.challenges.reasonCode === CancelReasonCode.PostponedorCanceled
          ? CancelType.FullReturn
          : CancelType.UserPart
      if (cancelChallengesData.execCount >= 2) {
        const message = `**URGENT** Challenge stuck in 'Processing Status' - Total Retries: ${cancelChallengesData.execCount - 1} Inception_Challenge_Id: ${cancelChallengesData.challengeId}`
        const messageData: JsonObject = {
          scChallengeId: cancelChallengesData.scChallengeId,
          networkName: cancelChallengesData.contracts.networks.name,
          contractAddress: cancelChallengesData.contracts.contractAddress,
          challengeId: cancelChallengesData.challengeId,
          CancelType: cancelType,
        }
        await sendProcessingAlert(message, EVENTS.ALERT.CHALLENGE_IN_SC_CANCELED, messageData)
        logger.info(`Message sent to alert-worker`)
      }

      await contractDataFeed.updateMany({
        where: {
          challengeId: cancelChallengesData.challengeId,
          event: CdfEvent.CancelledOrDraw,
        },
        data: {
          execCount: cancelChallengesData.execCount ? cancelChallengesData.execCount + 1 : 1,
        },
      })
      const cancelResponse: ChallengeFundsMoved | null = await cancelChallenge(
        cancelChallengesData.scChallengeId,
        cancelChallengesData.contracts.networks.name,
        cancelChallengesData.contracts.contractAddress,
        cancelChallengesData.challengeId,
        cancelType,
        cancelChallengesData.contracts.abiFile,
      )

      if (cancelResponse) {
        logger.info('cancelResponse:: ')
        logger.info(cancelResponse)
        await updateScResponse(cancelChallengesData, cancelResponse)
      }
    }
  } catch (error) {
    logger.error('Send cancelled challenges to SC error: ', error)
    process.exit(1)
  }
  logger.info('Send cancelled challenges to SC got stopped.')

  // Delay 60 seconds to send alert before exit
  await delay(60000)
  process.exit(0)
}

const updateScResponse = async (cancelChallengesData: JsonObject, cancelResponse: JsonObject): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cancelUsdPromises: any = []
  const challengesStatus = challenges.update({
    where: {
      challengeId: cancelChallengesData.challengeId,
    },
    data: {
      processingStatus: TxnStatus.Success,
    },
  })

  if (cancelResponse.winners.length > 0) {
    cancelUsdPromises = await updateCanceledWinLoss(cancelResponse, cancelChallengesData.challengeId)
  }

  const contractDataFeedStatus = contractDataFeed.updateMany({
    where: {
      challengeId: cancelChallengesData.challengeId,
      event: CdfEvent.CancelledOrDraw,
    },
    data: {
      status: TxnStatus.Success,
    },
  })
  await prismaClient.$transaction([...cancelUsdPromises, challengesStatus, contractDataFeedStatus])
  logger.info(`ChallengeId ${cancelChallengesData.challengeId} got cancelled in SC.`)

  const chlngParticipants = await challengeParticipations.findMany({
    where: {
      challengeId: cancelChallengesData.challengeId,
    },
    include: {
      walletAddress: {
        select: {
          userId: true,
        },
      },
      contracts: {
        select: {
          tokenName: true,
          networks: {
            select: {
              name: true,
            },
          },
        },
      },
      challenges: {
        select: {
          sport: {
            select: {
              sportName: true,
            },
          },
          challengeMode: true,
          challengeType: true,
          reasonCode: true,
        },
      },
      challengeResults: {
        select: {
          category: {
            select: {
              categoryApiTitle: true,
            },
          },
          participantOutcome: true,
        },
      },
    },
  })
  for (const eachPart of chlngParticipants) {
    const kafkaHeaders = {
      'caller-id': eachPart.walletAddress.userId,
      caller: 'system',
      ip: getSystemIp(),
      correlationId: getCorrelationId(),
    }
    const kafkaMessage: IKafkaMessage = {
      key: eachPart.walletAddress.userId,
      value: {
        eventName: EVENTS.BET.CANCELLED,
        data: {
          challenge: {
            id: eachPart.challengeId,
            sport: eachPart.challenges.sport.sportName,
            mode: eachPart.challenges.challengeMode,
            type: eachPart.challenges.challengeType,
            category: eachPart.challengeResults?.category?.categoryApiTitle,
            depth: eachPart.challengeDepth,
            outcome: eachPart.challengeResults?.participantOutcome,
            reasonCode: eachPart.challenges.reasonCode,
          },
          bet: {
            type: eachPart.contracts?.tokenName,
            amount: Number(eachPart.participationValueQty),
            amountInUsd: Number(eachPart.participationValueUsd),
            network: eachPart.contracts?.networks?.name,
          },
          source: Sources.Challenges,
          source_id: eachPart.challengeId,
        },
      },
    }
    producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)
  }
}

correlationIdMiddleware({}, null, async () => {
  await cancelChallengesToSc()
})
