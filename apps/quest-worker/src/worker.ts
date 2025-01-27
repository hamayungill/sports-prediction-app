import {
  IKafkaMessage,
  IKafkaMessageHeaders,
  IKafkaMessageValue,
  KafkaConsumer,
  retryHandler,
  sendAlert,
  sendToDlqAndAlert,
  sendToRetryTopic,
  validateHeaders,
  validateMessageValue,
} from '@duelnow/kafka-client'
import { AlertPriority, FatalError, NonRetriableError, RETRY, RetriableError, TOPICS, WORKERS } from '@duelnow/utils'
import { ConsumerConfig, IHeaders, KafkaMessage } from 'kafkajs'

import questLedgerProcessor from './questLedgerProcessor'
import processUserEvents from './userQuestsProcessor'
import { correlationIdMiddleware, envs, logger } from './utils'

const config: ConsumerConfig = {
  groupId: WORKERS.QUEST,
}
const brokers = envs.brokers?.split(',') as string[]

export const checkLogInfoAndSend = async (message: KafkaMessage, topic: string): Promise<void> => {
  const logInfo = new Promise((resolve, reject) => {
    try {
      const headers = message.headers as IHeaders
      correlationIdMiddleware(headers, null, async () => {
        await saveEventToDb(message, topic)
        resolve('resolved')
      })
    } catch (err) {
      reject(err)
    }
  })
  await logInfo
}

/**
 * @function processMessage
 * @param userId
 * @param message
 * @param topic
 *
 * Validates the message and header data and processes the events.
 */
export const processMessage = async (userId: string, message: KafkaMessage, topic: string): Promise<void> => {
  if (!(validateMessageValue(message) && validateHeaders(message.headers as IHeaders))) {
    throw new NonRetriableError(`Invalid data/headers in message`)
  } else {
    const msg = message.value?.toString()
    const headers = message.headers as IKafkaMessageHeaders
    if (msg) {
      try {
        const msgValue = JSON.parse(msg) as IKafkaMessageValue
        if (topic === TOPICS.TRACKING.QUEST.USERQUESTS) {
          await processUserEvents(userId, msgValue, headers)
        } else {
          const ledgerMessageData = msgValue.data
          if (
            ledgerMessageData &&
            typeof ledgerMessageData === 'object' &&
            'userQuestId' in ledgerMessageData &&
            'reward' in ledgerMessageData
          ) {
            // @ts-expect-error types of both keys would be sent accordingly from producer.
            await questLedgerProcessor(userId, ledgerMessageData)
          } else {
            throw new NonRetriableError(`Ledger message has invalid data in it's message`)
          }
        }
      } catch (error) {
        logger.error(`Error while processing message: ${msg}`, error)
        throw new RetriableError(`Error while processing message: ${msg}`)
      }
    }
  }
}

/**
 * @function saveEventToDb
 * @param message
 * @param topic
 *
 * Checks the mesage and headers and checks the log info to assign correlation-id
 * Calls appropriate functions to process the request.
 */
export const saveEventToDb = async (message: KafkaMessage, topic: string): Promise<void> => {
  const accId = message.key?.toString()
  const headers = message.headers as IKafkaMessageHeaders
  const attempt = headers.retryAttempt?.toString()
  if (!accId) throw new Error(`Value for "key" (userId) is missing in the message.`)
  try {
    if (!attempt) {
      await retryHandler(accId as string, RETRY.CHECK)
    }
    await processMessage(accId, message, topic)
    if (attempt) {
      await retryHandler(accId as string, RETRY.DECREMENT)
    }
  } catch (error) {
    logger.error(error)
    if (error instanceof RetriableError) {
      await sendToRetryTopic(message, WORKERS.QUEST)
    } else if (error instanceof NonRetriableError) {
      await sendToDlqAndAlert(message, JSON.stringify(error), WORKERS.QUEST)
    } else if (error instanceof FatalError) {
      logger.info('Stopping worker')
      const alertMessage: IKafkaMessage = {
        key: message.key?.toString() || '',
        value: {
          eventName: '',
          data: {
            message: 'CRITICAL: Quest Worker Stopped',
            priority: AlertPriority.Critical,
            source: WORKERS.QUEST,
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

/**
 * @function startWorker
 * Subscribes to tracking.quest.userquests and user.quest.ledger topics to receives messages.
 */
export async function startWorker(): Promise<void> {
  try {
    const topicsToSubscribe = [TOPICS.TRACKING.QUEST.USERQUESTS, TOPICS.USER.QUEST.LEDGER]
    await worker.connect()
    await worker.subscribe(topicsToSubscribe)
    logger.info(`Consuming messages from broker ${brokers} and topics ${topicsToSubscribe}`)
    await worker.startConsumer(checkLogInfoAndSend)
  } catch (error) {
    logger.error(error)
  }
}

export const worker = new KafkaConsumer(brokers, config)
