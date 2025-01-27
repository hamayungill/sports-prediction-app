/* eslint-disable @typescript-eslint/no-explicit-any */
import { KafkaConsumer, retryHandler, sendAlert, sendToDlqAndAlert, sendToRetryTopic } from '@duelnow/kafka-client'
import { EVENTS, FatalError, NonRetriableError, RETRY, RetriableError, WORKERS } from '@duelnow/utils'
import { APIClient, TrackClient } from 'customerio-node'
import * as dotenvExtended from 'dotenv-extended'

import { CALLER } from './utils/consts'
import customerio from './utils/customerio'
import customerioBroadcast from './utils/customerioBroadcast'
import { logger } from './utils/logger'
import { sendEventToCustomerio, startWorker } from './worker'

jest.mock('./utils/customerio', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    interceptors: {
      response: { use: jest.fn() },
    },
  },
}))
jest.mock('./utils/customerioBroadcast', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    interceptors: {
      response: { use: jest.fn() },
    },
  },
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
  return {
    ...jest.requireActual('@duelnow/utils'),
    RetriableError: jest.fn(),
    NonRetriableError: jest.fn(),
    FatalError: jest.fn(),
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
  }
})

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

const retryHandlerMock = jest.fn()
describe('sendEventToCustomerio function', () => {
  let validMessage: any

  beforeEach(() => {
    validMessage = {
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
        ip: '172.16.0.10',
        callerId: '1-2-3-4',
        caller: 'EVENT_CALLER.USER',
        ua: 'CHROME',
        retryAttempt: '',
      },
      timestamp: 'Valid timestamp',
      offset: '0',
      attributes: 0,
    }

    jest.spyOn(TrackClient.prototype, 'identify').mockResolvedValue(jest.fn())
    jest.spyOn(TrackClient.prototype, 'mergeCustomers').mockResolvedValue(jest.fn())
    jest.spyOn(TrackClient.prototype, 'trackAnonymous').mockResolvedValue(jest.fn())
    jest.spyOn(APIClient.prototype, 'sendEmail').mockResolvedValue(jest.fn())
    jest.spyOn(APIClient.prototype, 'getAttributes').mockResolvedValue({
      customer: {
        identifiers: {
          cio_id: '123',
        },
      },
    })
    jest.spyOn(APIClient.prototype, 'getCustomersByEmail').mockResolvedValue(Promise.resolve(false))
    jest.spyOn(KafkaConsumer.prototype, 'connect').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'subscribe').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'startConsumer').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'disconnect').mockImplementation(jest.fn())
    jest.spyOn(customerio, 'post').mockImplementation(jest.fn()) // Add this line to mock customerio.post
    jest.spyOn(customerioBroadcast, 'post').mockImplementation(jest.fn())
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Worker', () => {
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

    it('should pass with user event sign_out completed data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_OUT_COMPLETED,
          data: {},
        }),
      )
      await sendEventToCustomerio(validMessage)
      expect(customerio.post).toHaveBeenCalled()
    })

    it('should pass with user event waitlist joined data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.BULK_WAITLIST_JOINED,
          data: [
            {
              email: 'test@email.com',
              invite_code: 'fake_invite_code_1',
              caller_id: 'fake_caller_id_1',
            },
            {
              email: 'test2@email.com',
              invite_code: 'fake_invite_code_2',
              caller_id: 'fake_caller_id_2',
            },
          ],
        }),
      )
      await sendEventToCustomerio(validMessage)
      expect(customerioBroadcast.post).toHaveBeenCalledTimes(1)
    }, 8000)

    it('should not pass with user event waitlist joined data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.BULK_WAITLIST_JOINED,
          data: {},
        }),
      )
      await sendEventToCustomerio(validMessage)
      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should not pass with user event waitlist broadcast api fails', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.BULK_WAITLIST_JOINED,
          data: [
            {
              email: 'test@email.com',
              invite_code: 'fake_invite_code_1',
              caller_id: 'fake_caller_id_1',
            },
            {
              email: 'test2@email.com',
              invite_code: 'fake_invite_code_2',
              caller_id: 'fake_caller_id_2',
            },
          ],
        }),
      )
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      jest.spyOn(require('./utils/mapping'), 'getBroadcastData').mockResolvedValueOnce(true)
      jest.spyOn(customerioBroadcast, 'post').mockRejectedValueOnce(new Error('Error in customerioBroadcast'))

      await sendEventToCustomerio(validMessage)
    }, 10000)
    it('should process user event sign_in completed data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_IN_COMPLETED,
          data: {},
        }),
      )
      await sendEventToCustomerio(validMessage)
      expect(customerio.post).toHaveBeenCalled()
    })

    it('should process user event sign_up completed data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_UP_COMPLETED,
          data: {
            email: 'test@example.com',
            signUpMethod: 'email',
            signUpSource: 'regular',
            signUpTime: Date.now(),
          },
        }),
      )
      await sendEventToCustomerio(validMessage)
      expect(customerio.post).toHaveBeenCalled()
    })

    it('should fail process user event sign_up completed data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_UP_COMPLETED,
          data: {
            signUpSource: 'regular',
            signUpTime: Date.now(),
          },
        }),
      )
      await sendEventToCustomerio(validMessage)
      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should process page view event', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.PAGE_VIEWED,
          data: {
            path: '/home',
          },
        }),
      )
      validMessage.headers = {
        callerId: '1-2-3-4',
        retryAttempt: 1,
      }

      await sendEventToCustomerio(validMessage)
      expect(customerio.post).toHaveBeenCalled()
    })

    it('should process page view event when caller is anonymous', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.PAGE_VIEWED,
          data: {
            path: '/home',
          },
        }),
      )
      validMessage.headers = {
        caller: 'anonymous',
        callerId: '1-2-3-4',
        retryAttempt: 1,
      }

      await sendEventToCustomerio(validMessage)
      expect(TrackClient.prototype.trackAnonymous).toHaveBeenCalled()
    })

    it('should fail process page view event', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.PAGE_VIEWED,
          data: {},
        }),
      )

      await sendEventToCustomerio(validMessage)
      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should process user identified event', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.USER_IDENTIFIED,
          data: {
            anonymousId: 'test@example.com',
          },
        }),
      )
      await sendEventToCustomerio(validMessage)

      expect(customerio.post).toHaveBeenCalled()
    })

    it('should fail process user identified event', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.USER_IDENTIFIED,
          data: {},
        }),
      )
      await sendEventToCustomerio(validMessage)

      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should fail process user event when unknwon event name is pass', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: 'unknown',
          data: {},
        }),
      )
      const result = await sendEventToCustomerio(validMessage)

      expect(result).toBeUndefined()
    })

    it('should pass with user event email updated data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.EMAIL_VERIFICATION_SENT,
          data: {
            emailVerificationLink: 'www.google.com',
            newEmail: 'test@example.com',
          },
        }),
      )
      await sendEventToCustomerio(validMessage)
      expect(APIClient.prototype.sendEmail).toHaveBeenCalled()
    }, 6000)

    it('should not pass with user event email updated data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.EMAIL_VERIFICATION_SENT,
          data: {
            newEmail: 'test@example.com',
          },
        }),
      )
      await sendEventToCustomerio(validMessage)
      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should not pass getting error while sending email', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.EMAIL_VERIFICATION_SENT,
          data: {
            emailVerificationLink: 'www.google.com',
            newEmail: 'test@example.com',
          },
        }),
      )

      jest.spyOn(APIClient.prototype, 'sendEmail').mockRejectedValueOnce(new Error('Email sending error'))

      await sendEventToCustomerio(validMessage)

      expect(logger.info).toHaveBeenCalledWith('Send email verification event error:', new Error('Email sending error'))
    })

    it('should pass with user event profile update data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.PROFILE_UPDATED,
          data: {
            firstName: 'John',
            lastName: 'Smith',
          },
        }),
      )
      await sendEventToCustomerio(validMessage)
      expect(customerio.post).toHaveBeenCalled()
    })

    it('should pass profile update event with fields with email and meta', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.PROFILE_UPDATED,
          data: {
            meta: { terms: { v: '1' } },
            newEmail: 'John@example.com',
            emailVerified: true,
            oldEmail: 'John@gmail.com',
          },
        }),
      )
      await sendEventToCustomerio(validMessage)
      expect(TrackClient.prototype.mergeCustomers).toHaveBeenCalled()
      expect(TrackClient.prototype.identify).toHaveBeenCalled()
    })

    it('should not pass profile update event when data is empty', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.PROFILE_UPDATED,
          data: {},
        }),
      )
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      jest.spyOn(require('./utils/mapping'), 'getProfileUpdateData').mockResolvedValueOnce(undefined)
      await sendEventToCustomerio(validMessage)
      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should handle RetriableError in sendEventToCustomerio', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_UP_COMPLETED,
          data: {
            signUpSource: 'regular',
            signUpTime: Date.now(),
          },
        }),
      )
      const error = new RetriableError('Retriable error')
      await sendEventToCustomerio(validMessage)
      jest.spyOn(customerio, 'post').mockRejectedValueOnce(error)
      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should handle NonRetriableError in sendEventToCustomerio', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_UP_COMPLETED,
          data: {
            signUpSource: 'regular',
            signUpTime: Date.now(),
          },
        }),
      )
      const error = new NonRetriableError('NonRetriable error')
      jest.spyOn(customerio, 'post').mockRejectedValueOnce(error)
      await sendEventToCustomerio(validMessage)
      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should handle FatalError in sendEventToCustomerio', async () => {
      if (validMessage.headers) validMessage.headers.retryAttempt = '1'
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_UP_COMPLETED,
          data: {
            signUpSource: 'regular',
            signUpTime: Date.now(),
          },
        }),
      )
      const error = new FatalError('Fatal error')
      jest.spyOn(customerio, 'post').mockRejectedValueOnce(error)
      await sendEventToCustomerio(validMessage)
      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should handle unknown error in sendEventToCustomerio', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_UP_COMPLETED,
          data: {
            signUpSource: 'regular',
            signUpTime: Date.now(),
          },
        }),
      )
      jest.spyOn(customerio, 'post').mockRejectedValueOnce(new Error('Unknown error'))
      await sendEventToCustomerio(validMessage)
      expect(logger.error).toHaveBeenCalled()
    })

    it('should send anonymous page view event', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.PAGE_VIEWED,
          data: {
            pageName: 'HomePage',
          },
        }),
      )
      validMessage.headers.caller = CALLER.ANONYMOUS

      const eventData = {
        identifiers: {
          anonymous_id: 'anon_123',
        },
        name: 'HomePage',
      }
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      jest.spyOn(require('./utils/mapping'), 'getPageViewTrackData').mockResolvedValueOnce(eventData)

      const trackAnonymousSpy = jest
        .spyOn(TrackClient.prototype, 'trackAnonymous')
        .mockResolvedValueOnce({ anonymous_id: 'anon_123' })

      await sendEventToCustomerio(validMessage)

      expect(trackAnonymousSpy).toHaveBeenCalledWith(eventData.identifiers.anonymous_id, {
        name: eventData.name,
        data: {
          name: eventData.name,
        },
      })
      expect(logger.info).toHaveBeenCalledWith('Send anonymous page view event response:', {
        anonymous_id: 'anon_123',
      })
    })
  })

  describe('Error handling', () => {
    it('should handle RetriableError in sendEventToCustomerio', async () => {
      const error = new RetriableError('Test RetriableError')
      retryHandlerMock.mockImplementationOnce(() => {
        throw error
      })

      await sendEventToCustomerio(validMessage)

      expect(retryHandler).toHaveBeenCalledWith(validMessage.headers.callerId, RETRY.CHECK)
      expect(logger.error).toHaveBeenCalledWith('Error in sending event to customerio', error)
      expect(sendToRetryTopic).toHaveBeenCalledWith(validMessage, WORKERS.CUSTOMERIO)
    })

    it('should handle NonRetriableError in sendEventToCustomerio', async () => {
      const error = new NonRetriableError('Test NonRetriableError')
      retryHandlerMock.mockImplementationOnce(() => {
        throw error
      })

      await sendEventToCustomerio(validMessage)

      expect(retryHandler).toHaveBeenCalledWith(validMessage.headers.callerId, RETRY.CHECK)
      expect(logger.error).toHaveBeenCalledWith('Error in sending event to customerio', error)
      expect(sendToDlqAndAlert).toHaveBeenCalledWith(validMessage, error, WORKERS.CUSTOMERIO)
    })

    it('should handle FatalError in sendEventToCustomerio', async () => {
      const error = new FatalError('Test FatalError')
      retryHandlerMock.mockImplementationOnce(() => {
        throw error
      })
      await sendEventToCustomerio(validMessage)

      expect(retryHandler).toHaveBeenCalledWith(validMessage.headers.callerId, RETRY.CHECK)
      expect(logger.error).toHaveBeenCalledWith('Error in sending event to customerio', error)
      expect(sendAlert).toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith('Stopping consumer')
    })
  })
})
