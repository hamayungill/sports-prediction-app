import prismaClient from '@duelnow/database'
import { KafkaConsumer } from '@duelnow/kafka-client'
import * as dotenvExtended from 'dotenv-extended'
import { v4 as uuidv4 } from 'uuid'

import { producer } from './utils/kafkaProducer'
import { logger } from './utils/logger'
import { checkLogInfoAndSend, saveEventToDb, startWorker } from './worker'

let resolved = 1

jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

jest.mock('@duelnow/database', () => {
  const actualPrisma = jest.requireActual('@duelnow/database')
  return {
    __esModule: true,
    default: {
      users: {
        update: jest.fn(),
      },
      membershipLevels: {
        findFirst: jest.fn(),
      },
    },
    Prisma: {
      ...actualPrisma.Prisma,
    },
  }
})

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

jest.mock('@duelnow/utils', () => {
  const actualUtils = jest.requireActual('@duelnow/utils')
  return {
    WORKERS: actualUtils.WORKERS,
    TOPICS: actualUtils.TOPICS,
    EVENTS: actualUtils.EVENTS,
    RETRY: actualUtils.RETRY,
    NonRetriableError: jest.fn().mockImplementation((message) => {
      const error = new Error(message)
      error.name = 'NonRetriableError'
      return error
    }),
    RetriableError: jest.fn().mockImplementation((message) => {
      const error = new Error(message)
      error.name = 'RetriableError'
      return error
    }),
    AlertPriority: actualUtils.AlertPriority,
    EventCaller: actualUtils.EventCaller,
    isLocal: jest.fn(),
  }
})

jest.mock('@duelnow/kafka-client', () => {
  return {
    ...jest.requireActual('@duelnow/kafka-client'),
    KafkaProducer: jest.fn(),
    retryHandler: jest.fn().mockImplementation(() => {
      if (resolved === 3) {
        const error = new Error('Error')
        error.name = 'RetriableError'
        return error
      }
      return Promise.resolve()
    }),
    sendToDlqAndAlert: jest.fn(),
    sendToRetryTopic: jest.fn().mockImplementation(() => {
      return true
    }),
    sendAlert: jest.fn(),
    validateHeaders: jest.fn().mockImplementation(() => {
      return true
    }),
    validateMessageValue: jest.fn().mockImplementation(() => {
      if (resolved === 2) {
        return false
      }
      return true
    }),
    sendMessage: jest.fn().mockResolvedValue({}),
  }
})

const userMockedData = {
  key: 'user_id',
  data: {
    eventName: 'membership_updated',
    balance: 1,
    walletAddress: '0x',
  },
}

describe('User Worker', () => {
  beforeEach(() => {
    jest.spyOn(KafkaConsumer.prototype, 'connect').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'subscribe').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'startConsumer').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('loads .env.example file when GITHUB_ACTIONS is set', () => {
    process.env.GITHUB_ACTIONS = 'true'

    jest.isolateModules(() => {
      require('./utils')
    })

    expect(dotenvExtended.load).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '.env.example',
      }),
    )
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

  xit('should create the user', async () => {
    jest.mock('./utils', () => ({
      ...jest.requireActual('./utils'),
      producer: {
        sendMessage: jest.fn(),
      },
    }))
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.users.update.mockResolvedValue({})

    // @ts-expect-error We are mocking function so won't cause any issue
    uuidv4.mockReturnValue('mocked-uuid-value')

    // @ts-expect-error We are mocking function so won't cause any issue
    producer.sendMessage = await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(userMockedData)),
      key: Buffer.from('key'),
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {
        correlationId: '1-2-3-4-5',
        appId: '0',
        requestPath: '/',
        requestMethod: 'GET',
        platformId: '0',
        ip: '172.16.0.10',
        callerId: '1-2-3-4',
        caller: 'user',
        ua: 'CHROME',
        retryAttempt: '1',
      },
    }
    await saveEventToDb(kafkaMessage)
    expect(prismaClient.users.update).toHaveBeenCalledTimes(1)
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining(`User updated successfully`))
  })

  xit('should return error when query fails', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.users.update.mockRejectedValue(null)

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.membershipLevels.findFirst.mockResolvedValue({})

    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(userMockedData)),
      key: Buffer.from('key'),
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {
        correlationId: '1-2-3-4-5',
        appId: '0',
        requestPath: '/',
        requestMethod: 'GET',
        platformId: '0',
        ip: '172.16.0.10',
        callerId: '1-2-3-4',
        caller: 'user',
        ua: 'CHROME',
      },
    }
    await saveEventToDb(kafkaMessage)

    expect(prismaClient.users.update).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(`Error processing user meesage:`))
  })

  it('should throw an error while checking log info', async () => {
    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(userMockedData)),
      key: Buffer.from('key'),
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {
        correlationId: '1-2-3-4-5',
        appId: '0',
        requestPath: '/',
        requestMethod: 'GET',
        platformId: '0',
        ip: '172.16.0.10',
        callerId: '1-2-3-4',
        caller: 'user',
        ua: 'CHROME',
        retryAttempt: '1',
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { correlationIdMiddleware } = require('./utils/logger')
    correlationIdMiddleware.mockImplementation(() => {
      throw new Error('LogInfo check failed')
    })

    await expect(checkLogInfoAndSend(kafkaMessage)).rejects.toThrow('LogInfo check failed')
  })

  xit('should return when header is invalid', async () => {
    resolved = 2
    await startWorker()
    const kafkaMessage = {
      value: null,
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
    }
    await saveEventToDb(kafkaMessage as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    resolved = 1
  })
})
