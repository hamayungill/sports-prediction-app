/* eslint-disable @typescript-eslint/no-explicit-any */
import * as kcli from '@duelnow/kafka-client'
import { FatalError, NonRetriableError, RetriableError } from '@duelnow/utils'
import { mockDeep } from 'jest-mock-extended'

import * as questLedgerProcessor from './questLedgerProcessor'
import * as processUserEvents from './userQuestsProcessor'
import * as utils from './utils'
import * as wrkr from './worker'

const { logger } = utils
jest.mock('./utils', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn() },
  envs: {
    pointRateUsd: 0.005,
    brokers: 'localhost:9092',
  },
  correlationIdMiddleware: jest.fn(),
}))
jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))
jest.mock('@duelnow/kafka-client', () => ({
  KafkaConsumer: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    subscribe: jest.fn(),
    startConsumer: jest.fn(),
    disconnect: jest.fn(),
  })),
  retryHandler: jest.fn(),
  sendToRetryTopic: jest.fn(),
  sendToDlqAndAlert: jest.fn(),
  sendAlert: jest.fn(),
  validateMessageValue: jest.fn(),
  validateHeaders: jest.fn(),
}))
jest.mock('@duelnow/database', () => ({
  ...jest.requireActual('@duelnow/database'),
  prismaClientConstantDb: mockDeep(),
}))

const KConsumer = wrkr.worker

describe('processMessage function', () => {
  const userId = 'test-user-id'
  const topic = 'test-topic'
  const mockMessage = {
    value: Buffer.from(JSON.stringify({ data: { userQuestId: '123', reward: 100 } })),
    headers: {},
  }
  let mockValidateMessage: jest.SpyInstance
  let mockValidateHeaders: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockValidateMessage = jest.spyOn(kcli, 'validateMessageValue')
    mockValidateHeaders = jest.spyOn(kcli, 'validateHeaders')
  })

  it('should throw NonRetriableError when message or headers are invalid', async () => {
    mockValidateMessage.mockReturnValue(false)

    await expect(wrkr.processMessage(userId, mockMessage as any, topic)).rejects.toThrow(NonRetriableError)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('should process user quest events when topic is USERQUESTS', async () => {
    mockValidateMessage.mockReturnValue(true)
    mockValidateHeaders.mockReturnValue(true)
    const processUserEventsSpy = jest.spyOn(processUserEvents, 'default').mockResolvedValue()

    await wrkr.processMessage(userId, mockMessage as any, 'tracking.quest.userquests')
    expect(processUserEventsSpy).toHaveBeenCalledWith(userId, expect.any(Object), expect.any(Object))
  })

  it('should call questLedgerProcessor for ledger events', async () => {
    mockValidateMessage.mockReturnValue(true)
    mockValidateHeaders.mockReturnValue(true)
    const questLedgerProcessorSpy = jest.spyOn(questLedgerProcessor, 'default').mockResolvedValue()

    await wrkr.processMessage(userId, mockMessage as any, 'user.quest.ledger')
    expect(questLedgerProcessorSpy).toHaveBeenCalledWith(userId, expect.any(Object))
  })

  it('should throw NonRetriableError for ledger event when no reward', async () => {
    mockValidateMessage.mockReturnValue(true)
    mockValidateHeaders.mockReturnValue(true)

    await expect(
      wrkr.processMessage(
        userId,
        {
          value: Buffer.from(JSON.stringify({ data: { userQuestId: '213' } })),
          headers: {},
        } as any,
        'user.quest.ledger',
      ),
    ).rejects.toThrow()
  })

  it('should throw RetriableError on processing error', async () => {
    mockValidateMessage.mockReturnValue(true)
    mockValidateHeaders.mockReturnValue(true)
    jest.spyOn(processUserEvents, 'default').mockRejectedValue(new Error('Processing error'))

    await expect(wrkr.processMessage(userId, mockMessage as any, 'tracking.quest.userquests')).rejects.toThrow(
      RetriableError,
    )
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error while processing message'),
      new Error('Processing error'),
    )
  })
})

describe('saveEventToDb function', () => {
  const mockMessage = {
    key: Buffer.from('test-user-id'),
    headers: {
      retryAttempt: Buffer.from('1'),
    },
  }
  let disconnectSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    disconnectSpy = jest.spyOn(KConsumer, 'disconnect')
  })

  it('should call processMessage and retryHandler for valid message', async () => {
    const retryHandlerSpy = jest.spyOn(kcli, 'retryHandler').mockResolvedValueOnce(null)
    const processMessageSpy = jest.spyOn(wrkr, 'processMessage').mockResolvedValueOnce(undefined)

    await wrkr.saveEventToDb(mockMessage as any, 'test-topic')

    expect(retryHandlerSpy).toHaveBeenCalledWith('test-user-id', 2)
    expect(processMessageSpy).toHaveBeenCalledWith('test-user-id', mockMessage as any, 'test-topic')
  })

  it('should call retryHandler when retryAttempt is missing', async () => {
    const retryHandlerSpy = jest.spyOn(kcli, 'retryHandler').mockResolvedValueOnce(null)

    await wrkr.saveEventToDb(
      {
        key: Buffer.from('test-user-id'),
        headers: {},
      } as any,
      'test-topic',
    )

    expect(retryHandlerSpy).toHaveBeenCalledWith('test-user-id', 0)
  })

  it('should throw error when key is missing', async () => {
    await expect(
      wrkr.saveEventToDb(
        {
          headers: {},
        } as any,
        'test-topic',
      ),
    ).rejects.toThrow(`Value for "key" (userId) is missing in the message.`)
  })

  it('should handle RetriableError and send to retry topic', async () => {
    const retriableError = new RetriableError('Retriable error')
    jest.spyOn(wrkr, 'processMessage').mockRejectedValue(retriableError)

    await wrkr.saveEventToDb(mockMessage as any, 'test-topic')

    expect(logger.error).toHaveBeenCalledWith(retriableError)
    expect(kcli.sendToRetryTopic).toHaveBeenCalledWith(mockMessage, expect.any(String))
  })

  it('should handle NonRetriableError and send to DLQ and alert', async () => {
    const nonRetriableError = new NonRetriableError('Non-retriable error')
    jest.spyOn(wrkr, 'processMessage').mockRejectedValue(nonRetriableError)

    await wrkr.saveEventToDb(mockMessage as any, 'test-topic')

    expect(logger.error).toHaveBeenCalledWith(nonRetriableError)
    expect(kcli.sendToDlqAndAlert).toHaveBeenCalledWith(
      mockMessage,
      JSON.stringify(nonRetriableError),
      expect.any(String),
    )
  })

  it('should handle FatalError, stop worker, and send critical alert', async () => {
    const fatalError = new FatalError('Fatal error')
    jest.spyOn(wrkr, 'processMessage').mockRejectedValue(fatalError)
    disconnectSpy.mockResolvedValueOnce(undefined)

    await wrkr.saveEventToDb(mockMessage as any, 'test-topic')

    expect(logger.error).toHaveBeenCalledWith(fatalError)
    expect(kcli.sendAlert).toHaveBeenCalled()
    expect(disconnectSpy).toHaveBeenCalled()
  })
})

describe('startWorker function', () => {
  let connectSpy: jest.SpyInstance
  let subscribeSpy: jest.SpyInstance
  let startConsumerSpy: jest.SpyInstance
  beforeEach(() => {
    jest.clearAllMocks()
    connectSpy = jest.spyOn(KConsumer, 'connect')
    subscribeSpy = jest.spyOn(KConsumer, 'subscribe')
    startConsumerSpy = jest.spyOn(KConsumer, 'startConsumer')
  })

  it('should successfully start the Kafka consumer and subscribe to topics', async () => {
    connectSpy.mockResolvedValueOnce(undefined)
    subscribeSpy.mockResolvedValueOnce(undefined)
    startConsumerSpy.mockResolvedValueOnce(undefined)

    await wrkr.startWorker()

    expect(connectSpy).toHaveBeenCalled()
    expect(subscribeSpy).toHaveBeenCalledWith(['tracking.quest.userquests', 'user.quest.ledger'])
    expect(startConsumerSpy).toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Consuming messages from broker'))
  })

  it('should log error if starting the worker fails', async () => {
    const error = new Error('Connection failure')
    jest.spyOn(KConsumer, 'connect').mockRejectedValueOnce(error)

    await wrkr.startWorker()

    expect(logger.error).toHaveBeenCalledWith(error)
  })
})

describe('checkLogInfoAndSend', () => {
  const message = {
    headers: { someHeader: 'headerValue' },
    key: Buffer.from('userId'),
    value: Buffer.from('{"data": "someData"}'),
  } as unknown as kcli.KafkaMessage
  const topic = 'test-topic'
  let checkLogInfoSpy: jest.SpyInstance
  let saveEventToDbSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock correlationIdMiddleware and saveEventToDb to resolve
    checkLogInfoSpy = jest.spyOn(utils, 'correlationIdMiddleware')
    saveEventToDbSpy = jest.spyOn(wrkr, 'saveEventToDb')
  })

  it('should call correlationIdMiddleware and saveEventToDb on success', async () => {
    checkLogInfoSpy.mockImplementation((headers, res, callback) => {
      callback()
    })

    saveEventToDbSpy.mockResolvedValue(undefined)

    await wrkr.checkLogInfoAndSend(message, topic)

    // Expectations
    expect(checkLogInfoSpy).toHaveBeenCalledWith(message.headers, null, expect.any(Function))
    expect(saveEventToDbSpy).toHaveBeenCalledWith(message, topic)
  })

  it('should log an error and reject if correlationIdMiddleware fails', async () => {
    checkLogInfoSpy.mockImplementation(() => {
      throw new Error('Test error in correlationIdMiddleware')
    })

    // Expect the function to reject and log the error
    await expect(wrkr.checkLogInfoAndSend(message, topic)).rejects.toThrow('Test error in correlationIdMiddleware')

    // Ensure saveEventToDb was not called
    expect(wrkr.saveEventToDb).not.toHaveBeenCalled()
  })

  it('should resolve successfully if both correlationIdMiddleware and saveEventToDb succeed', async () => {
    checkLogInfoSpy.mockImplementation((headers, res, callback) => {
      callback()
    })

    saveEventToDbSpy.mockResolvedValue(undefined)

    await expect(wrkr.checkLogInfoAndSend(message, topic)).resolves.toBeUndefined()

    // Ensure both functions were called successfully
    expect(checkLogInfoSpy).toHaveBeenCalledWith(message.headers, null, expect.any(Function))
    expect(saveEventToDbSpy).toHaveBeenCalledWith(message, topic)
  })
})
