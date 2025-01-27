/* eslint no-case-declarations: "off" */
/* eslint-disable @typescript-eslint/no-explicit-any */
import prismaClient from '@duelnow/database'
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
import {
  AlertPriority,
  EVENTS,
  EventCaller,
  NonRetriableError,
  RETRY,
  RetriableError,
  TOPICS,
  WORKERS,
} from '@duelnow/utils'
import { ConsumerConfig, IHeaders, KafkaMessage } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid'
const { users } = prismaClient

import { KAFKA_BROKER_URLS, correlationIdMiddleware, logger, producer } from './utils'

const config: ConsumerConfig = {
  groupId: WORKERS.USER,
}

const brokers = KAFKA_BROKER_URLS?.split(',') as string[]
const worker = new KafkaConsumer(brokers, config)

export const checkLogInfoAndSend = async (message: KafkaMessage): Promise<void> => {
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

export const processUserMessage = async (message: KafkaMessage): Promise<void> => {
  const messageVal = message.value?.toString() as string
  const headers = message.headers as IKafkaMessageHeaders
  const value = JSON.parse(messageVal)

  try {
    switch (value.data.eventName) {
      case EVENTS.TRACKING.MEMBERSHIP_UPDATED:
        await updateMembershipLevel(value.data, headers)
    }
  } catch (error) {
    logger.error(`Error processing user meesage: ${error}`)
    const kfkaMessage: IKafkaMessage = {
      key: uuidv4(),
      value: {
        eventName: EVENTS.TRACKING.MEMBERSHIP_UPDATED,
        data: {
          error_message: error,
          success: false,
        },
      },
    }

    const { ip, caller, callerId, correlationId } = headers
    const kafkaHeaders = { ip, caller, callerId, correlationId }
    producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kfkaMessage, kafkaHeaders)
  }
}

export const saveEventToDb = async (message: KafkaMessage): Promise<void> => {
  try {
    if (!(validateMessageValue(message) && validateHeaders(message.headers as IHeaders))) {
      throw new NonRetriableError(`Invalid data/headers in message`)
    }
    const value = message.value?.toString() as string
    const headers = message.headers as IKafkaMessageHeaders
    const attempt = headers.retryAttempt?.toString()
    const accId = message.key?.toString()
    if (!attempt) {
      await retryHandler(accId as string, RETRY.CHECK)
    }
    const messageVal = JSON.parse(value)
    logger.debug(`Kafka message value: ${JSON.stringify(messageVal)}`)

    await processUserMessage(message)

    if (attempt) {
      await retryHandler(accId as string, RETRY.DECREMENT)
    }
  } catch (error) {
    logger.error(error)
    if (error instanceof RetriableError) {
      await sendToRetryTopic(message, WORKERS.USER)
    } else if (error instanceof NonRetriableError) {
      await sendToDlqAndAlert(message, JSON.stringify(error), WORKERS.USER)
    } else {
      logger.info('Stopping User worker')
      logger.error('Error: ', error)
      const alertMessage: IKafkaMessage = {
        key: message.key?.toString() || '',
        value: {
          eventName: '',
          data: {
            message: 'CRITICAL: User Worker Stopped',
            priority: AlertPriority.Critical,
            source: WORKERS.USER,
            details: {
              error: JSON.stringify(error),
              headers: JSON.stringify(message.headers),
            },
          },
        },
      }
      await sendAlert(alertMessage)
      await worker.disconnect()
    }
  }
}

export async function startWorker(): Promise<void> {
  try {
    const topicsToSubscribe = [TOPICS.USER.USER.USERS]
    await worker.connect()
    await worker.subscribe(topicsToSubscribe)
    logger.debug(`Consuming messages from broker in sports ${brokers} and topics ${topicsToSubscribe}`)
    await worker.startConsumer(checkLogInfoAndSend)
  } catch (error) {
    logger.error(error)
  }
}

export const updateMembershipLevel = async (levelId: number, headers: IKafkaMessageHeaders): Promise<void> => {
  const { callerId: userId, ip, correlationId } = headers
  await users.update({
    where: {
      userId,
    },
    data: {
      membershipLevelId: levelId,
    },
  })

  logger.info(`User updated successfully for UserId: ${userId} and levelId: ${levelId}`)

  const kfkaMessage: IKafkaMessage = {
    key: uuidv4(),
    value: {
      eventName: EVENTS.TRACKING.MEMBERSHIP_UPDATED,
      data: { levelId, userId },
    },
  }
  const kafkaHeaders = { ip, caller: EventCaller.System, callerId: userId, correlationId }
  producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kfkaMessage, kafkaHeaders)
}
