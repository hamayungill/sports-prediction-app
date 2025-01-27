/* eslint-disable @typescript-eslint/no-explicit-any */
import prismaClient, { Prisma } from '@duelnow/database'
import {
  IKafkaMessage,
  IKafkaMessageHeaders,
  KafkaConsumer,
  retryHandler,
  sendAlert,
  sendToDlqAndAlert,
  sendToRetryTopic,
  validateHeaders,
  validateMessageValue,
} from '@duelnow/kafka-client'
import { AlertPriority, EVENTS, NonRetriableError, RETRY, RetriableError, TOPICS, WORKERS } from '@duelnow/utils'
import { ConsumerConfig, IHeaders, KafkaMessage } from 'kafkajs'

import { correlationIdMiddleware, envs, logger, producer, raiseError } from './utils'
import { createDataFromMessage } from './utils/helpers'

const { events, goals } = prismaClient

const config: ConsumerConfig = {
  groupId: WORKERS.EVENT,
}
const brokers = envs.brokers?.split(',') as string[]
const worker = new KafkaConsumer(brokers, config)

export const processMessage = async (message: KafkaMessage): Promise<void> => {
  logger.debug('Raw kafka message', message)
  if (!(validateMessageValue(message) && validateHeaders(message.headers as IHeaders))) {
    throw new NonRetriableError(`Invalid data/headers in message`)
  } else {
    const msg = message.value?.toString()
    const headers = message.headers as IKafkaMessageHeaders
    if (msg) {
      const data = await createDataFromMessage(msg, headers)
      // only runs if 'userId' exists (not empty)
      if (data.userId) {
        if (data?.eventName === EVENTS.TRACKING.USER_IDENTIFIED) {
          updateAnonymousEvent(data, headers)
        }

        try {
          const Event = await events.create({
            data: data,
          })
          const questsData = await goals.findFirst({
            where: {
              OR: [
                {
                  goalSource: {
                    equals: data.eventName,
                    mode: 'insensitive',
                  },
                },
                {
                  negativeSource: {
                    equals: data.eventName,
                    mode: 'insensitive',
                  },
                },
              ],
              quest: {
                status: Prisma.Status.Active,
              },
            },
          })
          if (Event && questsData) {
            const kafkaHeaders = { ...headers, 'caller-id': Event.userId, caller: 'system' }
            const kafkaMessage: IKafkaMessage = {
              key: Event.userId,
              value: {
                eventName: data.eventName,
                data: Event,
              },
            }
            producer.sendMessage(TOPICS.TRACKING.QUEST.USERQUESTS, kafkaMessage, kafkaHeaders)
          }
          logger.info(`Event added to database successfully: ${JSON.stringify(Event)}`)
        } catch (error) {
          logger.error('Error adding event to database', error)
          raiseError(error)
        }
      }
    }
  }
}

export const saveEventToDb = async (message: KafkaMessage): Promise<void> => {
  const accId = message.key?.toString()
  const headers = message.headers as IKafkaMessageHeaders
  const attempt = headers.retryAttempt?.toString()
  try {
    if (!attempt) {
      await retryHandler(accId as string, RETRY.CHECK)
    }
    await processMessage(message)
    if (attempt) {
      await retryHandler(accId as string, RETRY.DECREMENT)
    }
  } catch (error) {
    logger.error(error)
    if (error instanceof RetriableError) {
      await sendToRetryTopic(message, WORKERS.EVENT)
    } else if (error instanceof NonRetriableError) {
      await sendToDlqAndAlert(message, JSON.stringify(error), WORKERS.EVENT)
    } else {
      logger.info('Stopping worker')
      const alertMessage: IKafkaMessage = {
        key: message.key?.toString() || '',
        value: {
          eventName: WORKERS.EVENT,
          data: {
            message: 'CRITICAL: Tracking Worker Stopped',
            priority: AlertPriority.Critical,
            source: WORKERS.EVENT,
            details: {
              error: JSON.stringify(error),
              headers: JSON.stringify(headers),
            },
          },
        },
      }
      await sendAlert(alertMessage)
      await worker.disconnect()
    }
  }
}

const checkLogInfoAndSend = async (message: KafkaMessage): Promise<void> => {
  const logInfo = new Promise((resolve, reject) => {
    try {
      const headers = message.headers as IHeaders
      correlationIdMiddleware(headers, null, async () => {
        await saveEventToDb(message)
        resolve('resolved')
      })
    } catch (err) {
      reject(err)
    }
  })
  await logInfo
}

export async function startWorker(): Promise<void> {
  try {
    const topicsToSubscribe = [TOPICS.TRACKING.USER.EVENTS]
    await worker.connect()
    await worker.subscribe(topicsToSubscribe)
    logger.info(`Consuming messages from broker ${brokers} and topics ${topicsToSubscribe}`)
    await worker.startConsumer(checkLogInfoAndSend)
  } catch (error) {
    logger.error(error)
  }
}

export const updateAnonymousEvent = async (data: Record<string, any>, headers: IKafkaMessageHeaders): Promise<void> => {
  const anonymousId = data.data.anonymousId
  const callerId = headers.callerId

  try {
    await prismaClient.events.updateMany({
      where: {
        userId: anonymousId,
      },
      data: {
        userId: callerId,
        notes: {
          set: `anonymousId: ${anonymousId}`,
        },
      },
    })
    logger.info(`Updated events for anonymousId ${anonymousId} to callerId ${callerId}`)
  } catch (error) {
    logger.error(`Error updating anonymous events: ${JSON.stringify(error)}`)
  }
}
