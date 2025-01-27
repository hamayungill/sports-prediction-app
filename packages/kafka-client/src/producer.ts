/* eslint-disable @typescript-eslint/no-explicit-any */
import { delay, isLocal } from '@duelnow/utils'
import { load } from 'dotenv-extended'
import { Kafka, KafkaMessage, LogEntry, Partitioners, Producer, RecordMetadata, logLevel } from 'kafkajs'

import { IKafkaMessage, IKafkaMessageHeaders, IKafkaProducer, envs, logger } from './utils'
load({
  errorOnMissing: true,
  includeProcessEnv: true,
})

export class KafkaProducer implements IKafkaProducer {
  private kafkaClient: Kafka
  private producer: Producer
  private clientId: string
  private brokersList = envs.brokers?.split(',') as string[]

  constructor(clientId: string, connectionTimeout = 5000) {
    this.kafkaClient = new Kafka({
      clientId,
      brokers: this.brokersList,
      connectionTimeout,
      ssl: isLocal() ? false : true, // don't use SSL in local environment
      logCreator: this.customLogCreator,
    })

    this.producer = this.kafkaClient.producer({ createPartitioner: Partitioners.DefaultPartitioner })

    this.clientId = clientId
  }

  // Custom logger for KafkaJS using the imported logger
  private customLogCreator = () => {
    return ({ level, log }: LogEntry): void => {
      const { message, ...extra } = log

      switch (level) {
        case logLevel.ERROR:
          logger.error(message, extra)
          break
        case logLevel.WARN:
          logger.warn(message, extra)
          break
        case logLevel.INFO:
          logger.info(message, extra)
          break
        case logLevel.DEBUG:
          logger.debug(message, extra)
          break
        default:
          logger.info(message, extra)
      }
    }
  }

  private getHeaders = (headers: Record<string, any>): Record<keyof IKafkaMessageHeaders, string> => {
    const parsedHeaders: IKafkaMessageHeaders = {
      correlationId: headers['correlation-id'] || headers.correlationId || '',
      caller: headers['caller'] || '',
      callerId: headers['callerId'] || headers['caller-id'] || '',
      ip:
        headers['cf-connecting-ip'] ||
        headers['x-client-ip'] ||
        headers['x-real-ip'] ||
        headers['x-forwarded-for'] ||
        '',
      ua: headers['user-agent'] || headers['userAgent'] || headers['ua'] || '',
      utm: headers?.utm ? JSON.stringify(headers.utm) : '',
      referer: headers?.referer || '',
      requestMethod: headers?.requestMethod || '',
      requestPath: headers?.requestPath || '',
    }

    // Existing IP handling logic
    if (parsedHeaders.ip) {
      let ip = parsedHeaders.ip
      if (Array.isArray(ip)) ip = ip[0]
      if (ip.includes(',')) {
        parsedHeaders.ip = ip.split(',')[0]?.trim()
      }
    }

    const newHeaders: Record<keyof IKafkaMessageHeaders, string> = {}
    for (const key in parsedHeaders) {
      newHeaders[key] = String(parsedHeaders[key] || '')
    }

    return newHeaders
  }

  async sendMessage(
    topic: string,
    message: IKafkaMessage,
    metadata: Record<string, any>,
    retries = 5,
    delayMs = 1000,
  ): Promise<RecordMetadata[]> {
    try {
      logger.debug('kafka producer metadata', { message, metadata })
      const headers = this.getHeaders(metadata)
      logger.debug('kafka producer headers', headers)
      await this.producer.connect()
      const resp = await this.producer.send({
        topic,
        messages: [
          {
            key: message.key,
            value: JSON.stringify(message.value),
            headers,
          },
        ],
      })
      await this.producer.disconnect()
      return resp
    } catch (error) {
      if (retries > 0) {
        logger.warn(`Error sending message, retrying in ${delayMs}ms...`, error)
        await delay(delayMs)
        return await this.sendMessage(topic, message, this.getHeaders(metadata), retries - 1, delayMs * 2) // Exponential backoff
      } else {
        logger.error('Failed to send message after retries:', error)
        throw error
      }
    }
  }

  async sendAsKafkaMessage(
    topic: string,
    message: KafkaMessage,
    retries = 5,
    delayMs = 1000,
  ): Promise<RecordMetadata[]> {
    try {
      await this.producer.connect()
      const resp = await this.producer.send({
        topic,
        messages: [
          {
            key: message.key,
            value: message.value,
            headers: message.headers,
          },
        ],
      })
      await this.producer.disconnect()
      return resp
    } catch (error) {
      if (retries > 0) {
        logger.warn(`Error sending message, retrying in ${delayMs}ms...`, error)
        await delay(delayMs)
        return await this.sendAsKafkaMessage(topic, message, retries - 1, delayMs * 2) // Exponential backoff
      } else {
        logger.error('Failed to send message after retries:', error)
        throw error
      }
    }
  }

  getClientId(): string {
    return this.clientId
  }
}
