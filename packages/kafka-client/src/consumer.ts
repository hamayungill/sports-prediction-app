import { isLocal } from '@duelnow/utils'
import { Consumer, ConsumerConfig, EachMessagePayload, Kafka, KafkaMessage, LogEntry, logLevel } from 'kafkajs'

import { logger } from './utils'
import { IKafkaConsumer } from './utils/types'

export class KafkaConsumer implements IKafkaConsumer {
  private kafkaClient: Kafka
  private consumer: Consumer
  private groupId: string
  private subscribedTopics: string[]

  constructor(brokers: string[], config: ConsumerConfig, connectionTimeout = 5000) {
    this.kafkaClient = new Kafka({
      brokers,
      connectionTimeout: connectionTimeout,
      ssl: isLocal() ? false : true, // don't use SSL in local environment
      logCreator: this.customLogCreator,
    })

    this.consumer = this.kafkaClient.consumer(config)
    this.groupId = config['groupId']
    this.subscribedTopics = ['']
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

  public getGroupId(): string {
    return this.groupId
  }

  public getSubscribedTopics(): string[] {
    return this.subscribedTopics
  }

  public async connect(): Promise<void> {
    try {
      await this.consumer.connect()
      logger.info('Connection success')
    } catch (error) {
      logger.error(`Error connecting to consumer: ${error}`)
      await this.connect()
    }
  }

  public async subscribe(topicsToSubscribe: string[]): Promise<void> {
    const topic = {
      topics: topicsToSubscribe,
      fromBeginning: true,
    }
    try {
      await this.consumer.subscribe(topic)
      this.subscribedTopics = topicsToSubscribe
    } catch (error) {
      logger.error(`Error subscribing: ${error}`)
      await this.subscribe(topicsToSubscribe)
    }
  }

  public async startConsumer(processMessage: (message: KafkaMessage, topic: string) => Promise<void>): Promise<void> {
    try {
      await this.consumer.run({
        eachMessage: async (messagePayload: EachMessagePayload) => {
          const { message, topic } = messagePayload
          await processMessage(message, topic)
        },
      })
    } catch (error) {
      logger.error(`Error while consuming message: ${error}`)
    }
  }

  public async disconnect(): Promise<void> {
    await this.consumer.disconnect()
  }
}
