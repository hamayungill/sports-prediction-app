import {
  ConsumerConfig,
  IBroadcastKafkaMessageValue,
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
import {
  AlertPriority,
  EVENTS,
  NonRetriableError,
  RETRY,
  RetriableError,
  TOPICS,
  WORKERS,
  bufferToString,
  delay,
} from '@duelnow/utils'
import { APIClient, IdentifierType, RegionUS, TrackClient } from 'customerio-node'

import { CALLER, CUSTOMERIO, brokers, correlationIdMiddleware, customerio, customerioBroadcast, logger } from './utils'
import {
  getBroadcastData,
  getEmailVerificationData,
  getPageViewTrackData,
  getProfileUpdateData,
  getUserIdentifiedTrackData,
  getUserTrackData,
} from './utils/mapping'
import { CioMessageHeaders } from './utils/types'

const config: ConsumerConfig = {
  groupId: WORKERS.CUSTOMERIO,
}

const brokersList = brokers?.split(',') as string[]
const worker = new KafkaConsumer(brokersList, config)

const cio = new TrackClient(`${CUSTOMERIO.api.siteId}`, `${CUSTOMERIO.api.key}`, { region: RegionUS })
const api = new APIClient(`${CUSTOMERIO.api.appKey}`, { region: RegionUS })

const sendApiBroadcast = async (data: IBroadcastKafkaMessageValue): Promise<void> => {
  const broadcastData = await getBroadcastData(data)
  logger.debug('Broadcast data', broadcastData)
  if (!broadcastData) {
    throw new NonRetriableError(
      `Data creation error for: ${JSON.stringify(data.data)} for broadcast event ${data.eventName}`,
    )
  }
  for (const emailData of data.data) {
    await cio.identify(emailData.callerId, {
      email: emailData.email,
      id: emailData.callerId,
    })
    logger.info(`Customer created with email ${emailData.email}`)
  }
  // Adding an intentional delay of 7 seconds after creating customers to ensure the customers are created on customer io, and the data is updated. It was not working with less than 5 seconds, so I added 2 more seconds to be on safe side.
  await delay(7000)
  try {
    const userEventResponse = await customerioBroadcast.post(CUSTOMERIO.ENDPOINTS.BROADCAST_CUSTOMERIO, broadcastData)
    logger.info('Broadcast event response:', userEventResponse)
  } catch (error) {
    throw new NonRetriableError(JSON.stringify(error))
  }
}

const sendUserEvent = async (data: IKafkaMessageValue, headers: CioMessageHeaders): Promise<void> => {
  const eventData = await getUserTrackData(data, headers)
  if (!eventData) {
    throw new NonRetriableError(`Data creation error for: ${JSON.stringify(data.data)} for event ${data.eventName}`)
  }
  if (data.eventName === EVENTS.AUTH.SIGN_UP_COMPLETED) {
    await cio.identify(headers.callerId, {
      email: data.data.email,
      id: headers.callerId,
      terms_of_use: data.data?.meta?.terms || {
        v1_0_0: false,
      },
    })
  }
  logger.debug('customerio eventData', eventData)
  const userEventResponse = await customerio.post(CUSTOMERIO.ENDPOINTS.TRACK_AUTH_CUSTOMERIO, eventData)
  logger.info('Send user event response:', userEventResponse)
}
const sendPageViewEvent = async (data: IKafkaMessageValue, headers: CioMessageHeaders): Promise<void> => {
  const eventData = await getPageViewTrackData(data, headers)
  if (!eventData) {
    throw new NonRetriableError(`Data creation error for: ${JSON.stringify(data.data)} for event ${data.eventName}`)
  }

  if (headers.caller === CALLER.ANONYMOUS) {
    const anonymousId = eventData.identifiers.anonymous_id
    const path = eventData.name
    const anonymousPageResponse = await cio.trackAnonymous(anonymousId, {
      name: path,
      data: {
        name: path,
      },
    })
    logger.info('Send anonymous page view event response:', anonymousPageResponse)
  } else {
    const pageResponse = await customerio.post(CUSTOMERIO.ENDPOINTS.TRACK_AUTH_CUSTOMERIO, eventData)
    logger.info('Send page view event response:', pageResponse)
  }
}
const sendUserIdentifiedEvent = async (data: IKafkaMessageValue, headers: CioMessageHeaders): Promise<void> => {
  const eventData = await getUserIdentifiedTrackData(data, headers)
  await cio.identify(headers.callerId, {
    anonymous_id: data.data.anonymousId,
  })
  logger.info('Identifying anonymous events')
  if (!eventData) {
    throw new NonRetriableError(`Data creation error for: ${JSON.stringify(data.data)} for event ${data.eventName}`)
  }
  const userIdentifiedRespose = await customerio.post(CUSTOMERIO.ENDPOINTS.TRACK_AUTH_CUSTOMERIO, eventData)
  logger.info('Send user identified event response:', userIdentifiedRespose)
}

const sendEmailVerificationEvent = async (data: IKafkaMessageValue, headers: CioMessageHeaders): Promise<void> => {
  const eventData = await getEmailVerificationData(data, headers)
  if (!eventData) {
    throw new NonRetriableError(`Data creation error for: ${JSON.stringify(data.data)} for event ${data.eventName}`)
  }
  try {
    const sendEmailResponse = await api.sendEmail(eventData)
    logger.info('Send email verification event response:', sendEmailResponse)
  } catch (error) {
    const alertMessage: IKafkaMessage = {
      key: data.data.newEmail?.toString() || '',
      value: {
        eventName: data?.eventName || '',
        data: {
          message: `${JSON.stringify(data.data)}`,
          priority: AlertPriority.Moderate,
          source: WORKERS.CUSTOMERIO,
          details: {
            error: JSON.stringify(error),
            headers: JSON.stringify(headers),
          },
        },
      },
    }
    await sendAlert(alertMessage)
    logger.info('Send email verification event error:', error)
  }
}

const sendUpdateProfileEvent = async (data: IKafkaMessageValue, headers: CioMessageHeaders): Promise<void> => {
  const eventData = await getProfileUpdateData(data, headers)
  const userId = headers.callerId
  const profile = await api.getAttributes(userId, IdentifierType.Id)

  logger.debug('Profile update data', data)
  logger.debug('Profile update headers', headers)
  logger.debug('Profile update eventData', eventData)
  logger.debug('Profile update profile', profile)

  if (data.data.newEmail) {
    logger.info(`Start merging customers primary ID ${userId} and new email ${data.data.newEmail}`)
    await cio.mergeCustomers(IdentifierType.Id, userId, IdentifierType.Email, data.data.newEmail)
  }
  // Add a delay of 2 seconds after merging customers to ensure consistency
  await delay(2000)
  logger.info('Finished merging customers')
  if (data.data.meta) {
    await cio.identify(`cio_${profile.customer.identifiers.cio_id}`, {
      terms_of_use: data.data.meta.terms,
    })
  }
  if (!eventData) {
    throw new NonRetriableError(`Data creation error for: ${JSON.stringify(data.data)} for event ${data.eventName}`)
  }

  cio.identify(`cio_${profile.customer.identifiers.cio_id}`, {
    email: data.data.newEmail,
  })
  const profileVerifiedResponse = await customerio.post(CUSTOMERIO.ENDPOINTS.TRACK_AUTH_CUSTOMERIO, eventData)
  logger.info('Send profile verified response:', profileVerifiedResponse)
}

export const processMessage = async (message: KafkaMessage): Promise<void> => {
  logger.debug('Process message', message)
  const msg = message.value?.toString()
  if (msg) {
    const msgValue = JSON.parse(msg)
    const headers = message.headers as CioMessageHeaders
    switch (msgValue.eventName) {
      case EVENTS.AUTH.SIGN_IN_COMPLETED:
      case EVENTS.AUTH.SIGN_UP_COMPLETED:
      case EVENTS.AUTH.SIGN_OUT_COMPLETED:
        await sendUserEvent(msgValue, headers)
        break
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
      case EVENTS.AUTH.BULK_WAITLIST_JOINED:
        logger.info(`Waitlist Joined Event Triggered.`)
        await sendApiBroadcast(msgValue)
        break
      default:
        await sendUserEvent(msgValue, headers)
    }
  }
}

export const sendEventToCustomerio = async (message: KafkaMessage): Promise<void> => {
  logger.debug('Customerio event message', bufferToString(message))
  const headers = message.headers as CioMessageHeaders
  logger.debug('Customerio event message headers', bufferToString(headers))
  const userId = headers.callerId?.toString()
  const attempt = headers.retryAttempt?.toString()
  try {
    if (!userId) {
      logger.warn('User ID is missing; will not process customerio message')
    } else {
      if (!attempt) {
        await retryHandler(userId as string, RETRY.CHECK)
      }

      await processMessage(message)

      if (attempt) {
        await retryHandler(userId as string, RETRY.DECREMENT)
      }
    }
  } catch (err) {
    logger.error('Error in sending event to customerio', err)
    if (err instanceof RetriableError) {
      await sendToRetryTopic(message, WORKERS.CUSTOMERIO)
    } else if (err instanceof NonRetriableError) {
      await sendToDlqAndAlert(message, err, WORKERS.CUSTOMERIO)
    } else {
      logger.info('Stopping consumer')
      const alertMessage: IKafkaMessage = {
        key: message.key?.toString() || '',
        value: {
          eventName: '',
          data: {
            message: 'CRITICAL: CustomerIO Worker Stopped',
            priority: AlertPriority.Critical,
            source: WORKERS.CUSTOMERIO,
            details: {
              error: JSON.stringify(err),
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
        await sendEventToCustomerio(message)
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
