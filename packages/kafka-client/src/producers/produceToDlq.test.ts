import { KafkaMessage } from 'kafkajs'

import { dlqProducer, sendToDlqAndAlert } from './produceToDlq'
import { IKafkaMessageHeaders, IKafkaMessageValue, logger, retryHandler, sendAlert } from '../utils'

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
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

jest.mock('../utils', () => ({
  __esModule: true,
  envs: { brokers: 'mockedBroker' },
  logger: { info: jest.fn() },
  retryHandler: jest.fn(),
  sendAlert: jest.fn(),
}))

describe('sendToDlqAndAlert', () => {
  beforeEach(() => {
    dlqProducer.sendAsKafkaMessage = jest.fn()
    jest.clearAllMocks()
  })

  it('should send to DLQ and trigger alert', async () => {
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

    const kafkaMessageVal: IKafkaMessageValue = {
      eventName: 'mockedEventName',
      data: { key: 'data' },
    }

    // Mocked message
    const mockedMessage: KafkaMessage = {
      key: Buffer.from('mockedKey'),
      value: Buffer.from(JSON.stringify(kafkaMessageVal)),
      headers: kafkaMessageHeader,
      timestamp: '2024-01-23T12:34:56Z',
      attributes: 1,
      offset: '12345',
    }

    // Mocked error details
    const mockedErrorDetails = 'Mocked error details'

    // Call the function
    await sendToDlqAndAlert(mockedMessage, mockedErrorDetails, 'Mocked-Worker')

    // Assertions
    expect(dlqProducer.sendAsKafkaMessage).toHaveBeenCalledWith('dead.letter.queue', mockedMessage)
    expect(logger.info).toHaveBeenCalled()
    expect(retryHandler).toHaveBeenCalledWith('callerId', 2)
    expect(sendAlert).toHaveBeenCalled()
  })
})
