import prismaClient from '@duelnow/database'
import { KafkaConsumer } from '@duelnow/kafka-client'

import { gameOddsKafkaMessage } from '../utils/fixtures'
import { logger } from '../utils/logger'
import { saveEventToDb, startWorker } from '../worker'

jest.mock('@duelnow/database', () => {
  const actualPrisma = jest.requireActual('@duelnow/database')
  return {
    __esModule: true,
    default: {
      gameOdds: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
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

describe('Game Odds', () => {
  beforeEach(() => {
    jest.spyOn(KafkaConsumer.prototype, 'connect').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'subscribe').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'startConsumer').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should process the game odds message and update the game Odd', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.gameOdds.findFirst.mockResolvedValue({
      homeTeamName: 'Team A',
      awayTeamName: 'Team B',
      gameDate: '2024-11-04T14:30:00.000Z',
      homeTeamId: 1,
      awayTeamId: 2,
      bookmakerTitle: 'Bookmaker X',
      odds: {
        oddsType: 'fractional',
        value: '5/1',
      },
      apiSourceId: 3,
      gameId: 101,
      createdAt: '2024-11-03T12:00:00.000Z',
      updatedAt: '2024-11-04T14:30:00.000Z',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.gameOdds.updateMany.mockResolvedValue({})

    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(gameOddsKafkaMessage)),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)

    expect(prismaClient.gameOdds.findFirst).toHaveBeenCalledTimes(1)
    expect(prismaClient.gameOdds.updateMany).toHaveBeenCalledTimes(1)

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining(`${gameOddsKafkaMessage.sport_name}:GameOdds:Updated:`),
    )
  })

  it('should process the game odds message and create the game Odd', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.gameOdds.findFirst.mockResolvedValue(null)

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.gameOdds.create.mockResolvedValue({})

    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(gameOddsKafkaMessage)),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)

    expect(prismaClient.gameOdds.findFirst).toHaveBeenCalledTimes(1)
    expect(prismaClient.gameOdds.create).toHaveBeenCalledTimes(1)

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining(`${gameOddsKafkaMessage.sport_name}:GameOdds:Created:`),
    )
  })

  it('should return an error while processing the game odds message', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.gameOdds.findFirst.mockRejectedValue(new Error('Error'))

    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(gameOddsKafkaMessage)),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)

    expect(prismaClient.gameOdds.findFirst).toHaveBeenCalledTimes(1)

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(`${gameOddsKafkaMessage.sport_name}:GameOdds:Error:`),
    )
  })
})
