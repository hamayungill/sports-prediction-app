import { RETRY, TOPICS } from '@duelnow/utils'
import { KafkaMessage } from 'kafkajs'

import { sendToDlqAndAlert } from './produceToDlq'
import { KafkaProducer } from '..'
import { IKafkaMessageHeaders, logger, retryHandler } from '../utils'

export const retryProducer = new KafkaProducer('retry-worker-retry')

export const sendToRetryTopic = async (message: KafkaMessage, worker: string): Promise<void> => {
  let retryTime = 2000
  let topic = TOPICS.SYSTEM.RETRY_ONE
  const now = Date.now()
  const headers = message.headers as IKafkaMessageHeaders
  Object.keys(headers).forEach((key) => {
    headers[key] = headers[key]?.toString()
  })
  headers.retryWorker = worker
  if (!headers.retryAttempt) {
    headers.retryAttempt = '1'
    headers.retryTimeInMs = (now + retryTime).toString()
  } else if (headers.retryAttempt === '1') {
    retryTime *= 2
    headers.retryAttempt = '2'
    headers.retryTimeInMs = (now + retryTime).toString()
    topic = TOPICS.SYSTEM.RETRY_TWO
  } else if (headers.retryAttempt === '2') {
    logger.debug('Retries exceeded, sending to message to dlq topic')
    await sendToDlqAndAlert(message, 'Retries exceeded, sending to message to dlq topic', worker)
  }
  try {
    logger.debug('Sending message to retry topic')
    const resp = await retryProducer.sendAsKafkaMessage(topic, message)
    logger.debug(`Message sent to retry: ${resp}`)
    const accId = message.key?.toString()
    if (headers.retryAttempt === '1') {
      await retryHandler(accId as string, RETRY.INCREMENT)
    }
  } catch (e) {
    logger.error(`Error producing a message to retry topic ${e}`)
  }
}
