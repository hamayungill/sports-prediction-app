/* eslint-disable @typescript-eslint/no-explicit-any */
import { KafkaConsumer, retryHandler, sendAlert, sendToDlqAndAlert, sendToRetryTopic } from '@duelnow/kafka-client'
import { EVENTS, FatalError, NonRetriableError, RETRY, RetriableError, WORKERS } from '@duelnow/utils'
import * as dotenvExtended from 'dotenv-extended'

import { logger } from './utils/logger'
import { identifyUser, trackAnonymousUser, trackAnonymousWaitlistJoinerEvent, trackEvent } from './utils/mixpanel'
import { sendEventToMixpanel, startWorker } from './worker'

jest.mock('@duelnow/logger', () => ({
  Logger: jest.fn(),
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  getLogger: jest.fn(),
}))

jest.mock('./utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  correlationIdMiddleware: jest.fn(),
}))

jest.mock('./utils/mixpanel', () => ({
  identifyUser: jest.fn(),
  setProperty: jest.fn(),
  trackEvent: jest.fn(),
  trackAnonymousUser: jest.fn(),
  trackAnonymousWaitlistJoinerEvent: jest.fn(),
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
    retryHandler: jest.fn(),
    sendToDlqAndAlert: jest.fn(),
    sendToRetryTopic: jest.fn(),
    sendAlert: jest.fn(),
  }
})

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

const retryHandlerMock = retryHandler as jest.Mock
describe('sendEventToMixpanel function', () => {
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
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
        retryAttempt: '',
      },
      timestamp: 'Valid timestamp',
      offset: '0',
      attributes: 0,
    }
    jest.spyOn(KafkaConsumer.prototype, 'connect').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'subscribe').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'startConsumer').mockImplementation(jest.fn())
    jest.spyOn(KafkaConsumer.prototype, 'disconnect').mockImplementation(jest.fn())
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
      validMessage.headers = {
        retryAttempt: 1,
      }
      await sendEventToMixpanel(validMessage)
      expect(trackEvent).toHaveBeenCalled()
    })

    it('should pass with user event waitlist joined data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.WAITLIST_JOINED,
          data: {
            inviteCode: 'fake_invite_code',
          },
        }),
      )
      validMessage.headers = {
        retryAttempt: 1,
      }
      await sendEventToMixpanel(validMessage)
      expect(trackAnonymousWaitlistJoinerEvent).toHaveBeenCalled()
    })

    it('should process user event sign_in completed data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_IN_COMPLETED,
          data: {},
        }),
      )
      await sendEventToMixpanel(validMessage)
      expect(trackEvent).toHaveBeenCalled()
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
      await sendEventToMixpanel(validMessage)
      expect(trackEvent).toHaveBeenCalled()
    })

    it('should process user event sign_up completed with opetional data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_UP_COMPLETED,
          data: {
            email: 'test@example.com',
            signUpMethod: 'email',
            signUpSource: 'regular',
            signUpTime: Date.now(),
            firstName: 'abc',
            lastName: 'def',
          },
        }),
      )
      await sendEventToMixpanel(validMessage)
      expect(trackEvent).toHaveBeenCalled()
    })

    it('should fail process user event sign_up completed data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.AUTH.SIGN_UP_COMPLETED,
          data: {
            signUpSource: 'regular',
            createdAt: Date.now(),
          },
        }),
      )
      await sendEventToMixpanel(validMessage)
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
        retryAttempt: 1,
      }

      await sendEventToMixpanel(validMessage)
      expect(trackEvent).toHaveBeenCalled()
    })

    it('should fail process page view event', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.PAGE_VIEWED,
          data: {},
        }),
      )

      await sendEventToMixpanel(validMessage)
      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should process mixpanel track anonymous fucntion when the caller is anonymous in page view event', async () => {
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
      }

      await sendEventToMixpanel(validMessage)
      expect(trackAnonymousUser).toHaveBeenCalled()
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
      await sendEventToMixpanel(validMessage)
      expect(identifyUser).toHaveBeenCalled()
    })

    it('should fail process user identified event', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.USER_IDENTIFIED,
          data: {},
        }),
      )
      await sendEventToMixpanel(validMessage)

      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should fail process user event when unknwon event name is pass', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: 'unknown',
          data: {},
        }),
      )
      const result = await sendEventToMixpanel(validMessage)

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
      await sendEventToMixpanel(validMessage)
      expect(trackEvent).toHaveBeenCalled()
    })

    it('should not pass with user event email when data is empty', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.EMAIL_VERIFICATION_SENT,
          data: {},
        }),
      )
      await sendEventToMixpanel(validMessage)
      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should pass with user event profile update data', async () => {
      validMessage.value = Buffer.from(
        JSON.stringify({
          eventName: EVENTS.TRACKING.PROFILE_UPDATED,
          data: {
            meta: { terms: { v: '1' } },
            newEmail: 'John@example.com',
            emailVerified: true,
            oldEmail: 'John@gmail.com',
            firstName: 'John',
            lastName: 'Smith',
          },
        }),
      )

      await sendEventToMixpanel(validMessage)
      expect(trackEvent).toHaveBeenCalled()
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
      await sendEventToMixpanel(validMessage)
      expect(sendToDlqAndAlert).toHaveBeenCalled()
    })

    it('should handle RetriableError in sendEventToMixpanel', async () => {
      const error = new RetriableError('Test RetriableError')
      retryHandlerMock.mockImplementationOnce(() => {
        throw error
      })

      await sendEventToMixpanel(validMessage)

      expect(retryHandler).toHaveBeenCalledWith(validMessage.key?.toString(), RETRY.CHECK)
      expect(logger.error).toHaveBeenCalledWith(error)
      expect(sendToRetryTopic).toHaveBeenCalledWith(validMessage, WORKERS.MIXPANEL)
    })

    it('should handle NonRetriableError in sendEventToMixpanel', async () => {
      const error = new NonRetriableError('Test NonRetriableError')
      retryHandlerMock.mockImplementationOnce(() => {
        throw error
      })

      await sendEventToMixpanel(validMessage)

      expect(retryHandler).toHaveBeenCalledWith(validMessage.key?.toString(), RETRY.CHECK)
      expect(logger.error).toHaveBeenCalledWith(error)
      expect(sendToDlqAndAlert).toHaveBeenCalledWith(validMessage, error, WORKERS.MIXPANEL)
    })

    it('should handle FatalError in sendEventToMixpanel', async () => {
      const error = new FatalError('Test FatalError')
      retryHandlerMock.mockImplementationOnce(() => {
        throw error
      })

      await sendEventToMixpanel(validMessage)

      expect(retryHandler).toHaveBeenCalledWith(validMessage.key?.toString(), RETRY.CHECK)
      expect(logger.error).toHaveBeenCalledWith(error)
      expect(sendAlert).toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith('Stopping consumer')
    })
  })
})
