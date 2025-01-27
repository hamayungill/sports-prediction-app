// TODO add tests
import prisma from '@duelnow/database'
import { KafkaConsumer, KafkaMessage, sendAlert, sendToDlqAndAlert, sendToRetryTopic } from '@duelnow/kafka-client'
import { EVENTS } from '@duelnow/utils'
import * as dotenvExtended from 'dotenv-extended'

import { logger } from './utils/logger'
import { processMessage, saveEventToDb, startWorker, updateAnonymousEvent } from './worker'

let resolvedWith = 1
jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('@duelnow/ip-info', () => {
  return {
    getIpInfo: jest.fn().mockImplementation(() => {
      return {}
    }),
  }
})

jest.mock('@duelnow/logger', () => ({
  Logger: jest.fn(),
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  getLogger: jest.fn(),
}))

jest.mock('./utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  correlationIdMiddleware: jest.fn(),
}))

jest.mock('./utils/kafkaProducer', () => ({
  producer: { sendMessage: jest.fn() },
}))

jest.mock('@duelnow/kafka-client', () => {
  return {
    ...jest.requireActual('@duelnow/kafka-client'),
    KafkaProducer: jest.fn(),
    retryHandler: jest.fn(),
    sendToDlqAndAlert: jest.fn(),
    sendToRetryTopic: jest.fn(),
    sendAlert: jest.fn(),
  }
})

jest.mock('@duelnow/database', () => ({
  events: {
    create: jest.fn(),
    findFirstOrThrow: jest.fn(),
    updateMany: jest.fn(),
  },
  quests: {
    findFirst: jest.fn(),
  },
  goals: {
    findFirst: jest.fn(),
  },
  Prisma: {
    Status: {
      Active: 'Active',
    },
  },
  ipLocation: {
    upsert: jest.fn(),
    updateMany: jest.fn(),
  },
}))

jest.mock('./utils/helpers', () => ({
  createDataFromMessage: (params: Record<string, string>): { eventName: string; userId: string } => {
    return { eventName: params.eventName, userId: '123' }
  },
}))

jest.mock('ua-parser-js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getResult: jest.fn().mockImplementation(() => {
        if (resolvedWith === 2) {
          return Promise.resolve({
            browser: {},
            os: {},
            device: {},
          })
        }
        return Promise.resolve({
          browser: { name: 'Chrome', version: '91.0.4472.124' },
          os: { name: 'Windows', version: '10' },
          device: { model: 'PC', type: 'desktop', vendor: '' },
        })
      }),
      setUA: jest.fn().mockReturnThis(),
    }
  })
})

const Event = {
  eventId: '123e4567-e89b-12d3-a456-426614174000',
  correlationId: '123e4567-e89b-12d3-a456-426614174001',
  userId: 'user-123',
  eventName: 'profile_updated',
  eventCaller: 'System',
  data: { key: 'user_identified', anotherKey: 'anotherValue' },
  locationId: 1,
  userAgent: 'Mozilla/5.0',
  browser: 'Firefox',
  device: 'Desktop',
  os: 'Windows',
  success: true,
  notes: 'User signed up successfully',
  errorMessage: null,
  apAuditLogId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('startWorker function', () => {
  beforeEach(() => {
    jest.spyOn(KafkaConsumer.prototype, 'connect').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'subscribe').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'startConsumer').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'disconnect').mockImplementation(jest.fn())
  })
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should start the consumer', async () => {
    await startWorker()
    expect(KafkaConsumer.prototype.connect).toHaveBeenCalled()
    expect(KafkaConsumer.prototype.subscribe).toHaveBeenCalled()
    expect(KafkaConsumer.prototype.startConsumer).toHaveBeenCalled()
  })

  it('should throw error while connecting to kafka', async () => {
    jest.spyOn(KafkaConsumer.prototype, 'connect').mockRejectedValueOnce(new Error())
    await startWorker()
    expect(KafkaConsumer.prototype.connect).toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalled()
  })

  it('loads .env.example file when GITHUB_ACTIONS is set', () => {
    process.env.GITHUB_ACTIONS = 'true'

    jest.isolateModules(() => {
      require('./utils/envs')
    })

    expect(dotenvExtended.load).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '.env.example',
      }),
    )
  })
})

const validData = {
  data: {
    anonymousId: 'anonymous-123',
  },
  eventName: EVENTS.TRACKING.USER_IDENTIFIED,
}
const validHeaders = {
  correlationId: 'correlation-123',
  requestPath: '/sports',
  requestMethod: 'GET',
  ip: '172.16.0.10',
  callerId: 'caller-123',
  caller: 'user',
  ua: 'CHROME',
  retryAttempt: '',
}

describe('saveEventToDb function', () => {
  let validMessage: KafkaMessage

  let invalidMessage: KafkaMessage

  beforeEach(() => {
    invalidMessage = {
      key: Buffer.from('Invalid key'),
      value: Buffer.from(JSON.stringify({ key1: 'value' })),
      headers: {
        valid: 'false',
        retryAttempt: '',
      },
      timestamp: 'Invalid timestamp',
      offset: '0',
      attributes: 0,
    }
    validMessage = {
      key: Buffer.from('key'),
      value: Buffer.from(
        JSON.stringify({
          eventAction: 'update_profile',
          eventName: 'profile_updated',
          field: 'authentication',
          data: {
            data_field_1: 'value_1',
          },
        }),
      ),
      headers: {
        correlationId: '1-2-3-4-5',
        requestPath: '/sports',
        requestMethod: 'GET',
        ip: '172.16.0.10',
        callerId: '1-2-3-4',
        caller: 'user',
        ua: 'CHROME',
        retryAttempt: '',
      },
      timestamp: 'Valid timestamp',
      offset: '0',
      attributes: 0,
    }
  })
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should send invalid message to dlq', async () => {
    await saveEventToDb(invalidMessage)
    expect(sendToDlqAndAlert).toHaveBeenCalled
  })

  it('should process a valid message', async () => {
    // Mock Prisma functions to throw an error

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.ipLocation.upsert.mockResolvedValue({
      locationId: 'test_location_id',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.findFirstOrThrow.mockResolvedValue({
      ...Event,
    })
    // Mock Prisma functions to throw an error
    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.create.mockResolvedValue({
      ...Event,
    })

    await processMessage(validMessage)

    expect(prisma.events.create).toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Event added to database successfully'))
  })

  it('should process a message when ua in header is empty', async () => {
    resolvedWith = 2
    // Mock Prisma functions to throw an error
    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.ipLocation.upsert.mockResolvedValue({
      locationId: 'test_location_id',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.findFirstOrThrow.mockResolvedValue({
      ...Event,
    })
    // Mock Prisma functions to throw an error
    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.create.mockResolvedValue({
      ...Event,
    })
    // Mock Prisma functions to throw an error
    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.quests.findFirst.mockResolvedValue({
      ...Event,
    })
    await processMessage(validMessage)

    expect(prisma.events.create).toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Event added to database successfully'))
  })

  it('should update anonymous events', async () => {
    prisma.events.updateMany = jest.fn().mockResolvedValue({ count: 1 })

    await updateAnonymousEvent(validData, validHeaders)

    expect(prisma.events.updateMany).toHaveBeenCalledWith({
      where: { userId: 'anonymous-123' },
      data: {
        userId: 'caller-123',
        notes: {
          set: 'anonymousId: anonymous-123',
        },
      },
    })
    expect(logger.info).toHaveBeenCalled()
  })

  it('should log error and raise error if updating anonymous events fails', async () => {
    const message = 'updating events failed'
    prisma.events.updateMany = jest.fn().mockRejectedValue(new Error(message))
    await expect(prisma.events.updateMany({ data: {} })).rejects.toThrow(message)
  })

  it('should call updateAnonymousEvent if eventName is USER_IDENTIFIED', async () => {
    await processMessage(validMessage)
    expect(prisma.events.updateMany).toHaveBeenCalled()
  })

  it('should try call remove retry after message processing ', async () => {
    if (validMessage.headers) validMessage.headers.retryAttempt = '1'
    // Mock Prisma functions to throw an error

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.ipLocation.upsert.mockResolvedValue({
      locationId: 'test_location_id',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.findFirstOrThrow.mockResolvedValue({
      ...Event,
    })
    // Mock Prisma functions to throw an error
    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.create.mockImplementation(jest.fn())
    await saveEventToDb(validMessage)

    expect(prisma.events.create).toHaveBeenCalled()
  })

  it('should retry on const db retriable error', async () => {
    // Mock Prisma functions to throw an error

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.ipLocation.upsert.mockResolvedValue({
      locationId: 'test_location_id',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.create.mockRejectedValueOnce({
      code: 'P1008',
    })

    await saveEventToDb(validMessage)
    expect(sendToRetryTopic).toHaveBeenCalled()
  })

  it('should send to dlq on non retriable db error', async () => {
    // Mock Prisma functions to throw an error

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.ipLocation.upsert.mockResolvedValue({
      locationId: 'test_location_id',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.create.mockRejectedValue({
      code: 'P2000',
    })

    await saveEventToDb(validMessage)
    expect(sendToDlqAndAlert).toHaveBeenCalled()
  })

  it('should retry on events db retriable error', async () => {
    // Mock Prisma functions to throw an error

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.ipLocation.upsert.mockResolvedValue({
      locationId: 'test_location_id',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.findFirstOrThrow.mockResolvedValue({
      ...Event,
    })
    // Mock Prisma functions to throw an error
    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.create.mockRejectedValueOnce({
      code: '1008',
    })
    await saveEventToDb(validMessage)
    expect(sendToRetryTopic).toHaveBeenCalled()
  })

  it('should send to dlq on non retriable db error', async () => {
    // Mock Prisma functions to throw an error

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.ipLocation.upsert.mockResolvedValue({
      locationId: 'test_location_id',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.findFirstOrThrow.mockResolvedValue({
      ...Event,
    })
    // Mock Prisma functions to throw an error
    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.create.mockRejectedValueOnce({
      code: 'P2000',
    })
    await saveEventToDb(validMessage)
    expect(sendToDlqAndAlert).toHaveBeenCalled()
  })

  it('should stop consumer and create alert of fatal db error', async () => {
    // Mock Prisma functions to throw an error

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.ipLocation.upsert.mockResolvedValue({
      locationId: 'test_location_id',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prisma.events.create.mockRejectedValueOnce({
      code: 'P1000',
    })
    await saveEventToDb(validMessage)
    expect(sendAlert).toHaveBeenCalled()
  })

  it('should send to dlq on non retriable parsing error', async () => {
    if (validMessage.headers) {
      validMessage.headers.appId = 'test'
      validMessage.headers.platformId = 'test'
    }

    await saveEventToDb(validMessage)
    expect(sendToDlqAndAlert).toHaveBeenCalled()
  })

  it('should send to dlq on wrong caller header', async () => {
    if (validMessage.headers) {
      validMessage.headers.caller = 'test'
    }

    await saveEventToDb(validMessage)
    expect(sendToDlqAndAlert).toHaveBeenCalled()
  })
})
