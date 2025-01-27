import prismaClient from '@duelnow/database'
import { KafkaConsumer } from '@duelnow/kafka-client'

import { teamKafkaMessage } from '../utils/fixtures'
import { logger } from '../utils/logger'
import { saveEventToDb, startWorker } from '../worker'

jest.mock('@duelnow/database', () => {
  const actualPrisma = jest.requireActual('@duelnow/database')
  return {
    __esModule: true,
    default: {
      teams: {
        upsert: jest.fn(),
      },
      teamInLeague: {
        upsert: jest.fn(),
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

describe('Teams', () => {
  beforeEach(() => {
    jest.spyOn(KafkaConsumer.prototype, 'connect').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'subscribe').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'startConsumer').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should process the team message', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.teams.upsert.mockResolvedValue({})

    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(teamKafkaMessage)),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)

    expect(prismaClient.teams.upsert).toHaveBeenCalledTimes(1)
    expect(prismaClient.teamInLeague.upsert).toHaveBeenCalledTimes(1)

    // @ts-expect-error We are mocking function so won't cause any issue
    delete teamKafkaMessage.data.internalLeagueId

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining(`${teamKafkaMessage.sport_name}:Team:Upserted: ${JSON.stringify(teamKafkaMessage.data)}`),
    )
  })

  it('should return an error while processing the team message', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.teams.upsert.mockRejectedValue(new Error('Error'))

    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(teamKafkaMessage)),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)

    expect(prismaClient.teams.upsert).toHaveBeenCalledTimes(1)
    expect(prismaClient.teamInLeague.upsert).toHaveBeenCalledTimes(0)

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(`${teamKafkaMessage.sport_name}:Team:Error:`))
  })
})
