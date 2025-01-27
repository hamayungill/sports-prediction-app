// eslint-disable-next-line import/order
import { messageHandler, startWorker } from './worker'

import { KafkaConsumer, KafkaMessage } from '@duelnow/kafka-client'
import { EVENTS, WORKERS } from '@duelnow/utils'
import { sendEventToCustomerio } from 'customerio-worker'
import * as dotenvExtended from 'dotenv-extended'
import { saveEventToDb } from 'event-worker'
import { sendEventToMixpanel } from 'mixpanel-worker'

import { logger } from './utils/logger'

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

jest.mock('event-worker', () => ({
  saveEventToDb: jest.fn(),
}))

jest.mock('mixpanel-worker', () => ({
  sendEventToMixpanel: jest.fn(),
}))

jest.mock('customerio-worker', () => ({
  sendEventToCustomerio: jest.fn(),
}))

describe('retry messages', () => {
  let validTrxMessage: KafkaMessage
  beforeEach(() => {
    validTrxMessage = {
      key: Buffer.from('key'),
      value: Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_OUT_COMPLETED,
          data: {
            signUpMethod: 'value_1',
          },
        }),
      ),
      headers: {
        retryWorker: WORKERS.CUSTOMERIO,
        retryAttempt: '1',
        retryTimeInMs: `${Date.now() + 2000}`,
        ip: '172.16.0.10',
        callerId: '1-2-3-4',
        caller: 'EVENT_CALLER.USER',
        ua: 'CHROME',
      },
      timestamp: 'Valid timestamp',
      offset: '0',
      attributes: 0,
    }

    jest.spyOn(KafkaConsumer.prototype, 'connect').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'subscribe').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'startConsumer').mockImplementation(jest.fn())
  })

  afterAll(() => {
    jest.clearAllMocks()
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

  it('should send valid message to retry event-worker', async () => {
    let headers = validTrxMessage.headers
    headers = { ...headers, retryWorker: WORKERS.EVENT }
    validTrxMessage.headers = headers
    await messageHandler(validTrxMessage)
    expect(saveEventToDb).toHaveBeenCalled()
    expect(saveEventToDb).toHaveBeenCalledWith(validTrxMessage)
  })

  it('should send valid message to retry customerio-worker', async () => {
    let headers = validTrxMessage.headers
    headers = { ...headers, retryWorker: WORKERS.CUSTOMERIO }
    validTrxMessage.headers = headers
    await messageHandler(validTrxMessage)
    expect(sendEventToCustomerio).toHaveBeenCalled()
    expect(sendEventToCustomerio).toHaveBeenCalledWith(validTrxMessage)
  })

  it('should send valid message to retry mixpanel-worker', async () => {
    let headers = validTrxMessage.headers
    headers = { ...headers, retryWorker: WORKERS.MIXPANEL }
    validTrxMessage.headers = headers
    await messageHandler(validTrxMessage)
    expect(sendEventToMixpanel).toHaveBeenCalled()
    expect(sendEventToMixpanel).toHaveBeenCalledWith(validTrxMessage)
  })
})
