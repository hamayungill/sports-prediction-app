import { KafkaMessage } from 'kafkajs'

import { sendToDlqAndAlert } from './produceToDlq'
import { retryProducer, sendToRetryTopic } from './produceToRetry'
import { IKafkaMessageHeaders, IKafkaMessageValue, logger, retryHandler } from '../utils'

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('../utils', () => ({
  __esModule: true,
  envs: { brokers: 'mockedBroker' },
  logger: { debug: jest.fn(), error: jest.fn() },
  retryHandler: jest.fn(),
}))

jest.mock('@duelnow/logger', () => ({
  Logger: jest.fn(),
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  getLogger: jest.fn(),
}))

jest.mock('../utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  correlationIdMiddleware: jest.fn(),
}))

jest.mock('./produceToDlq', () => ({
  __esModule: true,
  sendToDlqAndAlert: jest.fn(),
}))

// Mocked kafka message header
const kafkaMessageHeader: IKafkaMessageHeaders = {
  appId: 'appId',
  caller: 'caller',
  callerId: 'callerId',
  correlationId: 'correlationId',
  ip: 'ip',
  platformId: 'platformId',
  requestMethod: 'requestMethod',
  requestPath: 'requestPath',
  ua: 'ua',
}

// Mocked kafka message value
const kafkaMessageVal: IKafkaMessageValue = {
  eventName: 'mockedEventName',
  data: { key: 'data' },
}

// Mocked kafka message
const mockedMessage: KafkaMessage = {
  key: Buffer.from('mockedKey'),
  value: Buffer.from(JSON.stringify(kafkaMessageVal)),
  headers: kafkaMessageHeader,
  timestamp: '2024-01-23T12:34:56Z',
  attributes: 1,
  offset: '12345',
}

describe('sendToRetryTopic', () => {
  beforeEach(() => {
    retryProducer.sendAsKafkaMessage = jest.fn()
    jest.clearAllMocks()
  })

  it('should send to retry topic with retryAttempt = 1', async () => {
    // Call the function
    await sendToRetryTopic(mockedMessage, 'mockedWorker')

    // Assertions
    expect(retryProducer.sendAsKafkaMessage).toHaveBeenCalledWith('system.retry.one', mockedMessage)
    expect(logger.debug).toHaveBeenCalledWith('Sending message to retry topic')
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Message sent to retry'))
    expect(retryHandler).toHaveBeenCalledWith('mockedKey', 1)
  })

  it('should send to retry topic with retryAttempt = 2', async () => {
    // Call the function
    await sendToRetryTopic(mockedMessage, 'mockedWorker')

    // Assertions
    expect(retryProducer.sendAsKafkaMessage).toHaveBeenCalledWith('system.retry.two', mockedMessage)
    expect(logger.debug).toHaveBeenCalledWith('Sending message to retry topic')
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Message sent to retry'))
    expect(retryHandler).toHaveBeenCalledTimes(0)
  })

  it('should send to DLQ topic with retryAttempt = 2', async () => {
    // Mocked message with retryAttempt = 2
    // Call the function
    await sendToRetryTopic(mockedMessage, 'mockedWorker')

    // Assertions
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Retries exceeded'))
    expect(sendToDlqAndAlert).toHaveBeenCalledWith(
      mockedMessage,
      'Retries exceeded, sending to message to dlq topic',
      'mockedWorker',
    )
  })

  it('should handle error producing to retry topic', async () => {
    // Mocked error
    const mockedError = new Error('Mocked error')
    retryProducer.sendAsKafkaMessage = jest.fn().mockRejectedValue(mockedError)

    // Call the function
    await sendToRetryTopic(mockedMessage, 'mockedWorker')

    // Assertions
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error producing a message to retry topic'))
  })
})
