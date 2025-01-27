import { AlertPriority, RETRY, TOPICS } from '@duelnow/utils'
import { KafkaMessage } from 'kafkajs'

import { KafkaProducer } from '..'
import { IKafkaMessage, IKafkaMessageHeaders, IKafkaMessageValue, logger, retryHandler, sendAlert } from '../utils'

export const dlqProducer = new KafkaProducer('retry-worker-dlq')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendToDlqAndAlert = async (message: KafkaMessage, errorDetails: any, source: string): Promise<void> => {
  const topic = TOPICS.SYSTEM.DLQ
  const res = await dlqProducer.sendAsKafkaMessage(topic, message)
  logger.info(res)
  const msgValue = message.value?.toString()
  const headers = message.headers as IKafkaMessageHeaders
  const accId = headers?.callerId?.toString()
  Object.keys(headers).forEach((key) => {
    headers[key] = headers[key]?.toString()
  })
  let eventName = null
  if (msgValue) {
    const data = JSON.parse(msgValue) as IKafkaMessageValue
    eventName = data.eventName
  }
  if (accId) await retryHandler(accId as string, RETRY.DECREMENT)
  const error = {
    message: `Message sent to dlq for account ${accId} and event ${eventName} \n
        data: ${msgValue} \n
        headers: ${JSON.stringify(headers)} \n
        Error: ${errorDetails}`,
    name: 'DLQ',
  }
  const alertMessage: IKafkaMessage = {
    key: message.key?.toString() || '',
    value: {
      eventName: eventName || '',
      data: {
        message: `Message sent to dlq for account: ${accId}`,
        priority: AlertPriority.Moderate,
        source,
        details: {
          error: JSON.stringify(error),
          headers: JSON.stringify(headers),
        },
      },
    },
  }
  await sendAlert(alertMessage)
}
