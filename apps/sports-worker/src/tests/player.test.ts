import prismaClient from '@duelnow/database'
import { KafkaConsumer } from '@duelnow/kafka-client'

import { playerKafkaMessage } from '../utils/fixtures'
import { logger } from '../utils/logger'
import { saveEventToDb, startWorker } from '../worker'

jest.mock('@duelnow/database', () => {
  const actualPrisma = jest.requireActual('@duelnow/database')
  return {
    __esModule: true,
    default: {
      players: {
        upsert: jest.fn(),
      },
      playerInSport: {
        upsert: jest.fn(),
      },
      playerInTeam: {
        upsert: jest.fn(),
      },
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

describe('Player', () => {
  beforeEach(() => {
    jest.spyOn(KafkaConsumer.prototype, 'connect').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'subscribe').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'startConsumer').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should process the player message', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.players.upsert.mockResolvedValue({})

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.teams.upsert.mockResolvedValue({})

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.teamInLeague.upsert.mockResolvedValue({})

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.players.upsert.mockResolvedValue({})

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.players.upsert.mockResolvedValue({})

    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(playerKafkaMessage)),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)

    expect(prismaClient.players.upsert).toHaveBeenCalledTimes(1)
    expect(prismaClient.playerInSport.upsert).toHaveBeenCalledTimes(1)
    expect(prismaClient.playerInTeam.upsert).toHaveBeenCalledTimes(1)

    // @ts-expect-error We are mocking function so won't cause any issue
    delete playerKafkaMessage.data.internalTeamId

    // @ts-expect-error We are mocking function so won't cause any issue
    delete playerKafkaMessage.data.internalSeasonId

    // @ts-expect-error We are mocking function so won't cause any issue
    delete playerKafkaMessage.data.data.jnumber

    // @ts-expect-error We are mocking function so won't cause any issue
    delete playerKafkaMessage.data.data.position

    // @ts-expect-error We are mocking function so won't cause any issue
    delete playerKafkaMessage.data.data.internalTeamData

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining(`${playerKafkaMessage.sport_name}:Player:Upserted:`),
    )
  })

  it('should return an error while processing the player message', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.players.upsert.mockRejectedValue(new Error('Error'))

    await startWorker()
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(playerKafkaMessage)),
      key: null,
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      headers: {},
    }
    await saveEventToDb(kafkaMessage)

    expect(prismaClient.players.upsert).toHaveBeenCalledTimes(1)
    expect(prismaClient.playerInSport.upsert).toHaveBeenCalledTimes(0)
    expect(prismaClient.playerInTeam.upsert).toHaveBeenCalledTimes(0)

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(`${playerKafkaMessage.sport_name}:Player:Error:`))
  })
})
