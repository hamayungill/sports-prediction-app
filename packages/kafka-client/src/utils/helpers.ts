import { IHeaders, KafkaMessage } from 'kafkajs'

import { logger } from './logger'
import { IKafkaMessageHeaders } from './types'

export const validateHeaders = (msgHeaders: IHeaders): boolean => {
  if (msgHeaders) {
    const headers = msgHeaders as IKafkaMessageHeaders
    if (headers.caller && headers.callerId && headers.correlationId && headers.ip && headers.ua) {
      return true
    }
  }
  logger.error(`Invalid kafka header format: ${JSON.stringify(msgHeaders)}`)
  return false
}

export const validateMessageValue = (message: KafkaMessage): boolean | Error => {
  const msg = message.value?.toString()
  if (msg) {
    try {
      const val = JSON.parse(msg)
      if ((val.eventName || val.event_name) && val.data) {
        return true
      }
    } catch (error) {
      logger.error('Error validating kafka message value', error)
      return new Error('invalid message value')
    }
  }
  logger.error(`Invalid kafka message format: ${JSON.stringify(message)}`)
  return false
}
