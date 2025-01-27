import {
  ConsumerConfig,
  IHeaders,
  IKafkaMessage,
  IKafkaMessageValue,
  KafkaConsumer,
  KafkaMessage,
  retryHandler,
  sendAlert,
  sendToDlqAndAlert,
  sendToRetryTopic,
} from '@duelnow/kafka-client'
import { AlertPriority, EVENTS, NonRetriableError, RETRY, RetriableError, TOPICS, WORKERS } from '@duelnow/utils'

import { brokers, correlationIdMiddleware, logger } from './utils'
import { CALLER } from './utils/consts'
import {
  getEmailVerificationData,
  getPageViewTrackData,
  getProfileUpdateData,
  getUserTrackData,
  getWaitlistJoinedTrackData,
} from './utils/mapping'
import { identifyUser, trackAnonymousUser, trackAnonymousWaitlistJoinerEvent, trackEvent } from './utils/mixpanel'
import { MixpanelMessageHeaders } from './utils/types'

const config: ConsumerConfig = {
  groupId: WORKERS.MIXPANEL,
}

const brokersList = brokers?.split(',') as string[]
const worker = new KafkaConsumer(brokersList, config)

const sendUserEvent = async (data: IKafkaMessageValue, headers: MixpanelMessageHeaders): Promise<void> => {
  const eventData = await getUserTrackData(data, headers)
  if (!eventData) {
    throw new NonRetriableError(`Data creation error for: ${JSON.stringify(data.data)} for event ${data.eventName}`)
  }
  const userEventResponse = await trackEvent(data.eventName, eventData)
  logger.info('Send user event response:', userEventResponse)
}

const sendWaitlistJoinedEvent = async (data: IKafkaMessageValue, headers: MixpanelMessageHeaders): Promise<void> => {
  const eventData = await getWaitlistJoinedTrackData(data, headers)
  if (!eventData) {
    throw new NonRetriableError(`Data creation error for: ${JSON.stringify(data.data)} for event ${data.eventName}`)
  }
  await trackAnonymousWaitlistJoinerEvent(data.eventName, {
    callerId: headers.callerId,
    invite_code: eventData.invite_code,
  })
}

const sendPageViewEvent = async (data: IKafkaMessageValue, headers: MixpanelMessageHeaders): Promise<void> => {
  const eventData = await getPageViewTrackData(data, headers)
  if (!eventData) {
    throw new NonRetriableError(`Data creation error for: ${JSON.stringify(data.data)} for event ${data.eventName}`)
  }
  if (headers.caller === CALLER.ANONYMOUS) {
    trackAnonymousUser(data.eventName, headers)
  } else {
    await trackEvent(data.eventName, eventData)
    logger.info('Page view sent to Mixpanel')
  }
}

const sendUserIdentifiedEvent = async (data: IKafkaMessageValue, headers: MixpanelMessageHeaders): Promise<void> => {
  if (data.data.anonymousId) {
    const sendUserIdentifiedEvent = identifyUser(data.eventName, data.data.anonymousId, headers)
    logger.info('Send user identified event response:', JSON.stringify(sendUserIdentifiedEvent))
  } else {
    throw new NonRetriableError(`No anonymous id for event ${data.eventName}`)
  }
}

const sendEmailVerificationEvent = async (data: IKafkaMessageValue, headers: MixpanelMessageHeaders): Promise<void> => {
  const eventData = await getEmailVerificationData(data, headers)
  if (!eventData) {
    throw new NonRetriableError(`Data creation error for: ${JSON.stringify(data.data)} for event ${data.eventName}`)
  }
  await trackEvent(data.eventName, eventData)
  logger.info('Send email event response')
}

const sendUpdateProfileEvent = async (data: IKafkaMessageValue, headers: MixpanelMessageHeaders): Promise<void> => {
  const eventData = await getProfileUpdateData(data, headers)
  if (!eventData) {
    throw new NonRetriableError(`Data creation error for: ${JSON.stringify(data.data)} for event ${data.eventName}`)
  }
  await trackEvent(data.eventName, eventData)
  logger.info('Send profile event response')
}

export const processMessage = async (message: KafkaMessage): Promise<void> => {
  const msg = message.value?.toString()
  if (msg) {
    const msgValue = JSON.parse(msg)
    const headers = message.headers as MixpanelMessageHeaders
    switch (msgValue.eventName) {
      case EVENTS.TRACKING.PAGE_VIEWED:
        await sendPageViewEvent(msgValue, headers)
        break
      case EVENTS.TRACKING.USER_IDENTIFIED:
        await sendUserIdentifiedEvent(msgValue, headers)
        break
      case EVENTS.TRACKING.EMAIL_VERIFICATION_SENT:
        await sendEmailVerificationEvent(msgValue, headers)
        break
      case EVENTS.TRACKING.PROFILE_UPDATED:
        await sendUpdateProfileEvent(msgValue, headers)
        break
      case EVENTS.AUTH.WAITLIST_JOINED:
        await sendWaitlistJoinedEvent(msgValue, headers)
        break
      default:
        await sendUserEvent(msgValue, headers)
    }
  }
}

export const sendEventToMixpanel = async (message: KafkaMessage): Promise<void> => {
  const accId = message.key?.toString()
  const headers = message.headers as MixpanelMessageHeaders
  const attempt = headers.retryAttempt?.toString()
  try {
    if (!attempt) {
      await retryHandler(accId as string, RETRY.CHECK)
    }
    await processMessage(message)
    if (attempt) {
      await retryHandler(accId as string, RETRY.DECREMENT)
    }
  } catch (error) {
    logger.error(error)
    if (error instanceof RetriableError) {
      await sendToRetryTopic(message, WORKERS.MIXPANEL)
    } else if (error instanceof NonRetriableError) {
      await sendToDlqAndAlert(message, error, WORKERS.MIXPANEL)
    } else {
      logger.info('Stopping consumer')
      const alertMessage: IKafkaMessage = {
        key: message.key?.toString() || '',
        value: {
          eventName: '',
          data: {
            message: 'CRITICAL: Mixpanel Worker Stopped',
            priority: AlertPriority.Critical,
            source: WORKERS.MIXPANEL,
            details: {
              error: JSON.stringify(error),
              headers: JSON.stringify(headers),
            },
          },
        },
      }
      await sendAlert(alertMessage)
      await worker.disconnect()
    }
  }
}

const checkLogInfoAndSend = async (message: KafkaMessage): Promise<void> => {
  const logInfo = new Promise((resolve, reject) => {
    try {
      const headers = message.headers as IHeaders
      correlationIdMiddleware(headers, null, async () => {
        await sendEventToMixpanel(message)
        resolve('resolved')
      })
    } catch (err) {
      reject(err)
    }
  })
  await logInfo
}

export async function startWorker(): Promise<void> {
  try {
    const topicsToSubscribe = [TOPICS.TRACKING.USER.EVENTS]
    await worker.connect()
    await worker.subscribe(topicsToSubscribe)
    logger.info(`Consuming messages from broker ${brokers} and topics ${topicsToSubscribe}`)
    await worker.startConsumer(checkLogInfoAndSend)
  } catch (error) {
    logger.error(error)
  }
}
