/* eslint-disable  @typescript-eslint/no-explicit-any */
import { AlertPriority, FatalError, RETRY, WORKERS } from '@duelnow/utils'
import { Kafka, KafkaMessage } from 'kafkajs'

import { sendAlert } from './alerts'
import { validateHeaders, validateMessageValue } from './helpers'
import { getRedisClient, retryHandler } from './redis'
import { KafkaProducer } from '../producer'

import { IKafkaMessage, IKafkaMessageHeaders, IKafkaMessageValue, logger } from './index'

let resolved = 1 // 1 = success, 2 = fail

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('opsgenie-sdk', () => {
  return {
    configure: jest.fn(),
    alertV2: {
      create: jest.fn((alert: any, callback: any) => {
        if (resolved == 1) {
          // Simulate success
          callback(null, { simulatedResponse: 'success' })
        }
        if (resolved == 2) {
          // Simulate error
          callback(true, null)
        }
      }),
    },
  }
})

jest.mock('./logger', () => ({
  Logger: jest.fn(() => ({ getLogger: jest.fn() })),
  logger: { error: jest.fn(), info: jest.fn() },
}))

jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      connect: jest.fn(),
      get: jest.fn().mockImplementation(() => {
        if (resolved === 1) {
          return '1'
        }
        if (resolved === 2) {
          return '3'
        }
        return null
      }),
      del: jest.fn().mockImplementation(() => {
        return Promise.resolve('')
      }),
      set: jest.fn().mockImplementation(() => {
        return Promise.resolve('')
      }),
    }
  }),
}))

describe('Redis', () => {
  it('should throw RetriableError for RETRY.CHECK when record exists', async () => {
    const accountId = 'accountId'
    const type = RETRY.CHECK
    const result = await retryHandler(accountId, type)
    expect(result?.message).toBe('')
    expect(result?.name).toBe('RetriableError')
  })

  it('should decrement retry count for RETRY.DECREMENT when count < 1', async () => {
    resolved = 1
    const accountId = 'someAccountId'
    const type = RETRY.DECREMENT
    const mockRedisClient = await getRedisClient()
    if (mockRedisClient) {
      mockRedisClient.get = jest.fn().mockResolvedValue('1')
      await retryHandler(accountId, type)
      expect(mockRedisClient.del).not.toHaveBeenCalled()
    }
  })

  it('should decrement retry count for RETRY.DECREMENT when count > 1', async () => {
    resolved = 2
    const accountId = 'someAccountId'
    const type = RETRY.DECREMENT
    const mockRedisClient = await getRedisClient()
    if (mockRedisClient) {
      await mockRedisClient.set(accountId, 1)

      await retryHandler(accountId, type)
      expect(mockRedisClient.del).not.toHaveBeenCalled()
    }
  })

  it('should increment retry count for RETRY.INCREMENT when record found', async () => {
    resolved = 1
    const accountId = 'someAccountId'
    const type = RETRY.INCREMENT
    const mockRedisClient = await getRedisClient()
    if (mockRedisClient) {
      mockRedisClient.get = jest.fn().mockResolvedValue('2')
      await retryHandler(accountId, type)
      expect(mockRedisClient.del).not.toHaveBeenCalled()
    }
  })

  it('should increment retry count for RETRY.INCREMENT when record not found', async () => {
    resolved = 1
    const accountId = 'someAccountId'
    const type = RETRY.INCREMENT
    const mockRedisClient = await getRedisClient()
    if (mockRedisClient) {
      mockRedisClient.get = jest.fn().mockResolvedValue(null)
      await retryHandler(accountId, type)
      expect(mockRedisClient.del).not.toHaveBeenCalled()
    }
  })

  it('should catch error in catch block', async () => {
    await getRedisClient()
  })
})

describe('Alert', () => {
  let producer: KafkaProducer
  let mockKafkaProducer: any

  beforeEach(() => {
    mockKafkaProducer = {
      connect: jest.fn(),
      send: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
      logger: jest.fn(() => ({
        error: jest.fn(),
      })),
    }

    jest.spyOn(Kafka.prototype, 'producer').mockReturnValue(mockKafkaProducer)

    producer = new KafkaProducer('test-client')
    jest.spyOn(producer, 'sendMessage')
  })
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should throw an error', async () => {
    const error = new FatalError('Send alert fatal error Invalid message')
    const alertMessage: IKafkaMessage = {
      key: 'xyz',
      value: {
        eventName: '',
        data: {
          message: '',
          priority: AlertPriority.Critical,
          source: WORKERS.MIXPANEL,
          details: {
            error: JSON.stringify({ error: 'Invalid message' }),
          },
        },
      },
    }

    // Call the function
    await sendAlert(alertMessage)
    expect(logger.error).toHaveBeenCalledWith(error)
  })
})

describe('Helper Functions', () => {
  it('should return true for valid message value', () => {
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

    const result = validateMessageValue(mockedMessage)
    expect(result).toBe(true)
  })

  it('should throw an error for invalid message value', async () => {
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
    // Mocked kafka message with invalid message value
    const mockedMessage: KafkaMessage = {
      key: Buffer.from('mockedKey'),
      value: Buffer.from('string with invalid escape sequence\\x'),
      headers: kafkaMessageHeader,
      timestamp: '2024-01-23T12:34:56Z',
      attributes: 1,
      offset: '12345',
    }
    const result: any = validateMessageValue(mockedMessage)
    expect(result.message).toBe('invalid message value')
  })

  it('should throw an error for invalid message value when msg is undefined', async () => {
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
    // Mocked kafka message with invalid message value
    const mockedMessage: KafkaMessage = {
      key: Buffer.from('mockedKey'),
      value: null,
      headers: kafkaMessageHeader,
      timestamp: '2024-01-23T12:34:56Z',
      attributes: 1,
      offset: '12345',
    }
    const result: any = validateMessageValue(mockedMessage)
    expect(result).toBe(false)
  })

  it('should return true for valid headers', () => {
    const validHeaders = {
      appId: 'appId',
      caller: 'caller',
      callerId: 'callerId',
      correlationId: 'correlationId',
      ip: 'ip',
      platformId: 'platformId',
      requestMethod: 'GET',
      requestPath: '/some/path',
      ua: 'userAgent',
    }

    const result = validateHeaders(validHeaders)
    expect(result).toBe(true)
  })

  it('should return false for headers with missing properties', () => {
    const headersWithMissingProperties = {
      // Missing required properties
    }

    const result = validateHeaders(headersWithMissingProperties)
    expect(result).toBe(false)
  })
})
