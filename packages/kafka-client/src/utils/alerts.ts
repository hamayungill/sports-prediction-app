/* eslint-disable @typescript-eslint/no-explicit-any */
import { FatalError, TOPICS } from '@duelnow/utils'

import { logger } from './logger'
import { IKafkaMessage } from './types'
import { KafkaProducer } from '../producer'

export const sendAlert = async (message: IKafkaMessage): Promise<void> => {
  const producer = new KafkaProducer(message?.value?.data?.source || 'alert-worker')
  const topic = TOPICS.SYSTEM.ALERT
  try {
    if (message?.value?.data?.message !== '') {
      producer.sendMessage(topic, message, {})
    } else {
      throw new FatalError(`Send alert fatal error Invalid message`)
    }
  } catch (error) {
    logger.error(error)
  }
}
