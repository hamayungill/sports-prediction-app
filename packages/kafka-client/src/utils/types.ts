/* eslint-disable  @typescript-eslint/no-explicit-any */
import { ConsumerConfig, IHeaders, KafkaMessage, RecordMetadata } from 'kafkajs'

export type { ConsumerConfig, IHeaders, KafkaMessage }

export interface IBroadcastKafkaMessageValue {
  eventName: string
  data: [Record<string, any>]
}
export interface IKafkaConsumer {
  getGroupId(): string
  getSubscribedTopics(): string[]
  connect(): void
  subscribe(topicsToSubscribe: string[]): void
  startConsumer(processMessage: (message: KafkaMessage) => any): Promise<void>
  disconnect(): void
}
export interface IKafkaMessage {
  key: string
  value: IKafkaMessageValue
}

export interface IKafkaMessageHeaders extends IHeaders {
  caller: string
  callerId: string
  correlationId: string
  ip: string
  ua: string
  referer?: string
  utm?: string
}

export interface IKafkaMessageValue {
  eventName: string
  data: Record<string, any>
}

export interface IKafkaProducer {
  getClientId: () => string
  sendMessage(topic: string, message: IKafkaMessage, metadata: IKafkaMessageHeaders): Promise<RecordMetadata[]>
}
