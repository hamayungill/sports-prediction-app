import { KafkaConsumer } from '@duelnow/kafka-client'

import { logger } from '../utils/logger'
import { saveEventToDb, startWorker } from '../worker'

jest.mock('@duelnow/database', () => {
  const actualPrisma = jest.requireActual('@duelnow/database')
  return {
    __esModule: true,
    default: {},
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

jest.mock('../utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  correlationIdMiddleware: jest.fn(),
}))

jest.mock('@duelnow/utils', () => {
  const actualUtils = jest.requireActual('@duelnow/utils')
  return {
    Sports: actualUtils.Sports,
    WORKERS: actualUtils.WORKERS,
    GameShortStatusMapping: actualUtils.GameShortStatusMapping,
    TOPICS: actualUtils.TOPICS,
    RETRY: actualUtils.RETRY,
    NonRetriableError: jest.fn().mockImplementation((message) => {
      const error = new Error(message)
      error.name = 'NonRetriableError'
      return error
    }),
    RetriableError: jest.fn(),
    AlertPriority: actualUtils.AlertPriority,
    isLocal: jest.fn(),
  }
})

jest.mock('@duelnow/kafka-client', () => {
  return {
    ...jest.requireActual('@duelnow/kafka-client'),
    KafkaProducer: jest.fn(),
    retryHandler: jest.fn(),
    sendToDlqAndAlert: jest.fn(),
    sendToRetryTopic: jest.fn(),
    sendAlert: jest.fn(),
    validateHeaders: jest.fn().mockImplementation(() => {
      return true
    }),
    validateMessageValue: jest.fn().mockImplementation(() => {
      return true
    }),
  }
})

describe('Sports Worker', () => {
  beforeEach(() => {
    jest.spyOn(KafkaConsumer.prototype, 'connect').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'subscribe').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'startConsumer').mockImplementation(jest.fn())
  })

  afterEach(() => {
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

  it('should return when sport is invalid', async () => {
    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(
        JSON.stringify({
          schema_name: 'sport',
          sport_name: 'snooker',
          table: 'leagues',
          data: {},
        }),
      ),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)

    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining(`Data received for non-integrated game: snooker`))
  })

  it('should return when value table is undefined', async () => {
    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(
        JSON.stringify({
          schema_name: 'sport',
          sport_name: 'Basketball',
          data: {},
        }),
      ),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)
  })
})
