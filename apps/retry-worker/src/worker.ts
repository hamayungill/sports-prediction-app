import { ConsumerConfig, IHeaders, IKafkaMessageHeaders, KafkaConsumer, KafkaMessage } from '@duelnow/kafka-client'
import { TOPICS, WORKERS } from '@duelnow/utils'
import { sendEventToCustomerio } from 'customerio-worker'
import { saveEventToDb } from 'event-worker'
import { sendEventToMixpanel } from 'mixpanel-worker'

import { correlationIdMiddleware, envs, logger } from './utils/index'

const config: ConsumerConfig = {
  groupId: 'retry-worker',
}

const brokers = envs?.brokers?.split(',') as string[]
const worker = new KafkaConsumer(brokers, config)

export const messageHandler = async (message: KafkaMessage): Promise<void> => {
  const headers = message.headers as IKafkaMessageHeaders
  const retryWorker = headers.retryWorker?.toString()
  const timeToSleep = headers.retryTimeInMs?.toString()
  if (timeToSleep) {
    const tts = parseInt(timeToSleep)
    const now = Date.now()
    if (now < tts) {
      await new Promise((resolve) => setTimeout(resolve, now - tts))
    }
    switch (retryWorker) {
      case WORKERS.CUSTOMERIO:
        await sendEventToCustomerio(message)
        break
      case WORKERS.MIXPANEL:
        await sendEventToMixpanel(message)
        break
      case WORKERS.EVENT:
        await saveEventToDb(message)
    }
  }
}

const checkLogInfoAndSend = async (message: KafkaMessage): Promise<void> => {
  const logInfo = new Promise((resolve, reject) => {
    try {
      const headers = message.headers as IHeaders
      correlationIdMiddleware(headers, null, async () => {
        await messageHandler(message)
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
    const topicsToSubscribe = [TOPICS.SYSTEM.RETRY_ONE, TOPICS.SYSTEM.RETRY_TWO]
    await worker.connect()
    await worker.subscribe(topicsToSubscribe)
    logger.info(`Consuming messages from broker ${brokers} and topics ${topicsToSubscribe}`)
    await worker.startConsumer(checkLogInfoAndSend)
  } catch (error) {
    logger.error(error)
  }
}
