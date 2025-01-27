import prismaClient from '@duelnow/database'
import { KafkaConsumer } from '@duelnow/kafka-client'

import { leagueKafkaMessage } from '../utils/fixtures'
import { logger } from '../utils/logger'
import { saveEventToDb, startWorker } from '../worker'

jest.mock('@duelnow/database', () => {
  const actualPrisma = jest.requireActual('@duelnow/database')
  return {
    __esModule: true,
    default: {
      leagues: {
        upsert: jest.fn(),
      },
      seasons: {
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

describe('League', () => {
  beforeEach(() => {
    jest.spyOn(KafkaConsumer.prototype, 'connect').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'subscribe').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'startConsumer').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should process the league message', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.leagues.upsert.mockResolvedValue({})

    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(leagueKafkaMessage)),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)

    expect(prismaClient.leagues.upsert).toHaveBeenCalledTimes(1)

    // @ts-expect-error We are mocking function so won't cause any issue
    delete leagueKafkaMessage.data.internalSeasons

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining(
        `${leagueKafkaMessage.sport_name}:League:Upserted: ${JSON.stringify(leagueKafkaMessage.data)}`,
      ),
    )
  })

  it('should return an error while processing the league message', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.leagues.upsert.mockRejectedValue(new Error('Error'))

    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(leagueKafkaMessage)),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)

    expect(prismaClient.leagues.upsert).toHaveBeenCalledTimes(1)

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(`${leagueKafkaMessage.sport_name}:League:Error:`))
  })

  it('should process the league message for soccer', async () => {
    const leagueKafkaMessageForSoccer = {
      ...leagueKafkaMessage,
    }

    // @ts-expect-error We are mocking function so won't cause any issue
    leagueKafkaMessageForSoccer.data.internalSeasons = [2023, 2024]
    leagueKafkaMessageForSoccer.sport_name = 'Soccer'

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.leagues.upsert.mockResolvedValue({
      leagueId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.seasons.upsert.mockResolvedValue({})

    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(leagueKafkaMessageForSoccer)),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)

    expect(prismaClient.leagues.upsert).toHaveBeenCalledTimes(1)
    expect(prismaClient.seasons.upsert).toHaveBeenCalledTimes(2)

    // @ts-expect-error We are mocking function so won't cause any issue
    delete leagueKafkaMessage.data.internalSeasons

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining(
        `${leagueKafkaMessageForSoccer.sport_name}:League:Upserted: ${JSON.stringify(leagueKafkaMessageForSoccer.data)}`,
      ),
    )
  })
})
