import prismaClient, { Prisma } from '@duelnow/database'
import { IKafkaMessage, sendAlert } from '@duelnow/kafka-client'
import { getCorrelationId } from '@duelnow/logger'
import { AlertPriority, EventCaller, Sources, TOPICS, getSystemIp } from '@duelnow/utils'
import { JsonObject } from 'swagger-ui-express'
const { CdfEvent, ChallengeParticipationStatus } = Prisma
const { contractDataFeed, challengeParticipations, contracts } = prismaClient

import { producer } from '../utils'

const { NODE_ENV } = process.env

const sendProcessingAlert = async (message: string, event: string, data: JsonObject): Promise<void> => {
  const kafkaHeaders = { caller: EventCaller.System, ip: getSystemIp(), correlationId: getCorrelationId() }
  const kafkaMessage: IKafkaMessage = {
    key: String(data.challengeId),
    value: {
      eventName: event,
      data: {
        priority: AlertPriority.Critical,
        environment: NODE_ENV,
        message,
        source: 'cron-worker',
        details: {
          data: JSON.stringify(data),
          headers: JSON.stringify(kafkaHeaders),
        },
      },
    },
  }
  await sendAlert(kafkaMessage)
}

const getTokenAddressByScChallengeId = async (
  scChallengeId: number,
  sportsContractId: number,
): Promise<Record<string, unknown> | null> => {
  const results = await contractDataFeed.findMany({
    where: {
      event: {
        in: [CdfEvent.Create, CdfEvent.Join],
      },
      challenges: {
        scChallengeId: scChallengeId?.toString(),
        contractId: sportsContractId,
      },
    },
    select: {
      challengeId: true,
      contractId: true,
      contracts: {
        select: {
          contractAddress: true,
          tokenName: true,
          contractId: true,
        },
      },
    },
  })

  return results[0] || null
}

const sendEventToWorker = async (challengeId: number, paidWalletAddress: string, outcome: string): Promise<void> => {
  const chlngPartData = await challengeParticipations.findMany({
    where: {
      challengeId,
      paidWalletAddress,
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

  for (const eachPart of chlngPartData) {
    const kafkaHeaders = {
      'caller-id': eachPart.walletAddress.userId,
      caller: 'system',
      ip: getSystemIp(),
      correlationId: getCorrelationId(),
    }
    const kafkaMessage: IKafkaMessage = {
      key: eachPart.walletAddress.userId,
      value: {
        eventName: outcome,
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
            amount: Number(eachPart.participationWinLossQty),
            amountInUsd: Number(eachPart.participationWinLossUsd) || null,
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

const getTokenNameByTokenAddress = async (contractAddress: string, networkId: number): Promise<string | null> => {
  const token = await contracts.findFirst({
    where: {
      AND: [
        {
          contractAddress: {
            equals: contractAddress,
            mode: 'insensitive',
          },
        },
        {
          networkId,
        },
      ],
    },
  })
  return token?.tokenName || null
}

// updates win loss qty and usd value for all participants
const updateCanceledWinLoss = async (scData: JsonObject, challengeId: number): Promise<JsonObject[]> => {
  return scData.winners.map((data: string, index: number) => {
    return challengeParticipations.updateMany({
      where: {
        challengeId,
        paidWalletAddress: data,
      },
      data: {
        participationWinLossQty: scData.winnersProfit[index],
        participationWinLossUsd: scData.winnersProfitInUSD[index],
        status: ChallengeParticipationStatus.Inactive,
      },
    })
  })
}

export {
  getTokenAddressByScChallengeId,
  getTokenNameByTokenAddress,
  sendEventToWorker,
  sendProcessingAlert,
  updateCanceledWinLoss,
}
