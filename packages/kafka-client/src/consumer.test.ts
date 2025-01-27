/* eslint-disable  @typescript-eslint/no-explicit-any */

import { Kafka } from 'kafkajs'

import { KafkaConsumer } from './consumer'

jest.mock('@duelnow/utils', () => ({
  isLocal: jest.fn(),
}))

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('@duelnow/logger', () => ({
  Logger: jest.fn(),
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  getLogger: jest.fn(),
}))

jest.mock('./utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  correlationIdMiddleware: jest.fn(),
}))

describe('Kafka Consumer', () => {
  let consumer: KafkaConsumer
  const mockKafkaConsumer = {
    connect: jest.fn(),
    subscribe: jest.fn(),
    run: jest.fn(),
    disconnect: jest.fn(),
    commitOffsets: jest.fn(),
  } as any

  beforeEach(() => {
    jest.spyOn(Kafka.prototype, 'consumer').mockReturnValue(mockKafkaConsumer)
    consumer = new KafkaConsumer([], { groupId: 'test-groupId' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should consume messages and invoke callback', async () => {
    const topics = ['test-topic']

    const processMessage = jest.fn(() => Promise.resolve())

    // Mock the run method with a detailed implementation for eachMessage callback
    mockKafkaConsumer.run.mockImplementation(async (config: any) => {
      const messagePayload = {
        topic: 'test-topic',
        partition: 0,
        message: {
          key: Buffer.from('mockedKey'),
          value: Buffer.from(JSON.stringify({})),
          headers: {},
          timestamp: '2024-01-23T12:34:56Z',
          attributes: 1,
          offset: '12345',
        },
      }

      // Invoke the eachMessage callback
      await config.eachMessage(messagePayload)
    })
    await consumer.connect()
    await consumer.subscribe(topics)
    await consumer.startConsumer(processMessage)
    await consumer.disconnect()

    expect(mockKafkaConsumer.connect).toHaveBeenCalled()
    expect(mockKafkaConsumer.subscribe).toHaveBeenCalledWith({
      topics,
      fromBeginning: true,
    })
    expect(mockKafkaConsumer.run).toHaveBeenCalled()
    expect(mockKafkaConsumer.disconnect).toHaveBeenCalled()
  })

  it('should produce error', async () => {
    const topics = ['test-topic']

    const processMessage = jest.fn(() => Promise.resolve())
    mockKafkaConsumer.run.mockRejectedValue(new Error('error'))
    await consumer.connect()
    await consumer.subscribe(topics)
    await consumer.startConsumer(processMessage)
    await consumer.disconnect()

    expect(mockKafkaConsumer.connect).toHaveBeenCalled()
    expect(mockKafkaConsumer.subscribe).toHaveBeenCalledWith({
      topics,
      fromBeginning: true,
    })
    expect(mockKafkaConsumer.run).rejects.toBeInstanceOf(Error)
    expect(mockKafkaConsumer.disconnect).toHaveBeenCalled()
  })

  it('should check groupId', async () => {
    const groupId = consumer.getGroupId()
    expect(groupId).toEqual('test-groupId')
  })

  it('should reject connection', async () => {
    mockKafkaConsumer.connect.mockRejectedValueOnce(new Error('error'))
    try {
      await consumer.connect()
    } catch (error: any) {
      expect(error.message).toEqual('error')
    }
  })

  it('should check subscribed topic', async () => {
    await consumer.connect()
    await consumer.subscribe(['test-topic'])
    const topics = consumer.getSubscribedTopics()
    await consumer.disconnect()

    expect(topics).toEqual(['test-topic'])
  })

  it('should reject subscription', async () => {
    mockKafkaConsumer.subscribe.mockRejectedValueOnce(new Error('error'))
    try {
      await consumer.subscribe(['test-topic'])
    } catch (error: any) {
      expect(error.message).toEqual('error')
    }
  })
})
