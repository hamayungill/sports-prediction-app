import { IKafkaMessageHeaders, KafkaConsumer } from '@duelnow/kafka-client'
import { FatalError, TOPICS, WORKERS } from '@duelnow/utils'
import { ConsumerConfig, KafkaMessage } from 'kafkajs'

import { correlationIdMiddleware, envs, logger, sendAlert } from './utils'

const config: ConsumerConfig = {
  groupId: WORKERS.ALERT,
}
const brokers = envs.brokers?.split(',') as string[]
const worker = new KafkaConsumer(brokers, config)

export const alertHandler = async (message: KafkaMessage): Promise<void> => {
  const msg = message.value?.toString()
  try {
    if (msg) {
      const headers = message.headers as IKafkaMessageHeaders
      await sendAlert(msg, headers || null)
    } else {
      throw new FatalError(`Send alert fatal error Invalid message`)
    }
  } catch (error) {
    logger.error(error)
    logger.info('Stopping worker')
    await worker.disconnect()
  }
}

const checkLogInfoAndSend = async (message: KafkaMessage): Promise<void> => {
  const logInfo = new Promise((resolve, reject) => {
    try {
      const headers = message.headers as IKafkaMessageHeaders
      correlationIdMiddleware(headers, null, async () => {
        await alertHandler(message)
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
    const topicsToSubscribe = [TOPICS.SYSTEM.ALERT]
    await worker.connect()
    await worker.subscribe(topicsToSubscribe)
    logger.info(`Consuming messages from broker ${brokers} and topics ${topicsToSubscribe}`)
    await worker.startConsumer(checkLogInfoAndSend)
  } catch (error) {
    logger.error(error)
  }
}
