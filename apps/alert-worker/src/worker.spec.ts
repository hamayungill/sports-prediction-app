// TODO add tests
// eslint-disable-next-line import/order
import { IKafkaMessageHeaders, KafkaConsumer, KafkaMessage } from '@duelnow/kafka-client'
import { FatalError } from '@duelnow/utils'
import * as dotenvExtended from 'dotenv-extended'

import { sendAlert } from './utils/alerts'
import { logger } from './utils/logger'
import { alertHandler, startWorker } from './worker'

jest.mock('./utils/alerts', () => ({
  sendAlert: jest.fn(),
}))

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

describe('alertHandler function', () => {
  let validMessage: KafkaMessage
  let inValidMessage: KafkaMessage
  let alertMessage: object
  let headers: IKafkaMessageHeaders
  beforeEach(() => {
    alertMessage = {
      eventName: 'publish_results_to_sc',
      data: {
        priority: 'P1',
        environment: '',
        message: "**URGRNT** Challenge stuck in 'Processing Status' - Count: 1, Alert: 0 Inception_Challenge_Id: 1",
        source: 'cron-worker',
        details: {
          data: {
            challengeId: 1,
            scChallengeId: '1',
            networkName: 'networkName',
            contractAddress: 'contractAddress',
            tokenAddress: 'tokenAddress',
          },
          headers: { caller: 'system', ip: '127.0.0.1' },
        },
      },
    }
    headers = {
      correlationId: '1-2-3-4-5',
      appId: '0',
      requestPath: '/shop',
      requestMethod: 'GET',
      platformId: '0',
      ip: '172.16.0.10',
      callerId: '1-2-3-4',
      caller: 'user',
      ua: 'CHROME',
      retryAttempt: '',
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
        appId: '0',
        requestPath: '/shop',
        requestMethod: 'GET',
        platformId: '0',
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
    inValidMessage = {
      key: Buffer.from('key'),
      value: null,
      headers: {
        correlationId: '1-2-3-4-5',
        appId: '0',
        requestPath: '/shop',
        requestMethod: 'GET',
        platformId: '0',
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

  it('should process a valid message in sendAlert', async () => {
    await sendAlert(alertMessage.toString(), headers)
    await expect(sendAlert).toHaveBeenCalledWith(alertMessage.toString(), headers)
  })

  it('should process a valid message in alertHandler', async () => {
    await alertHandler(validMessage)
    await expect(sendAlert).toHaveBeenCalledWith(alertMessage.toString(), headers)
  })

  it('should not process with invalid message in alertHandler', async () => {
    const error = new FatalError('Send alert fatal error Invalid message')
    await alertHandler(inValidMessage)
    expect(logger.error).toHaveBeenCalledWith(error)
    await expect(logger.info).toHaveBeenCalledWith('Stopping worker')
  })
})
