/* eslint-disable @typescript-eslint/no-explicit-any */
import { IKafkaMessageValue } from '@duelnow/kafka-client'
import { EVENTS, transformKeys } from '@duelnow/utils'
import { SendEmailRequest } from 'customerio-node'

import { ACTION, CALLER, TYPE } from './consts'
import { CioMessageHeaders, UpdatedProperties } from './types'

const now = Date.now()

const stringifyHeaders = (headers: CioMessageHeaders): void => {
  Object.keys(headers).forEach((key) => {
    headers[key] = headers[key]?.toString()
  })
}

const getIdentifierFromHeaders = (headers: CioMessageHeaders): Record<string, string> => {
  const callerId = headers.callerId
  const eventProperties: Record<string, string> = {}

  switch (headers.caller) {
    case CALLER.ANONYMOUS:
      eventProperties['anonymous_id'] = callerId
      break
    default:
      eventProperties['id'] = callerId
  }

  return eventProperties
}

export const getBroadcastData = (msgValue: IKafkaMessageValue): Record<string, any> | null | void => {
  switch (msgValue.eventName) {
    case EVENTS.AUTH.BULK_WAITLIST_JOINED:
      if (!msgValue.data || !msgValue.data.length) return null
      return {
        per_user_data: msgValue.data.map((item: Record<string, string>) => ({
          email: item.email,
          data: {
            inviteCode: item.inviteCode,
          },
        })),
      }
  }
}

export const getEmailVerificationData = (
  msgValue: IKafkaMessageValue,
  headers: CioMessageHeaders,
): any | null | void => {
  stringifyHeaders(headers)
  if (headers.caller != CALLER.ANONYMOUS && msgValue.data.newEmail && msgValue.data.emailVerificationLink) {
    const request = new SendEmailRequest({
      transactional_message_id: 'verify_email',
      message_data: {
        emailVerificationLink: msgValue.data.emailVerificationLink,
      },
      identifiers: {
        email: msgValue.data.newEmail,
      },
      to: msgValue.data.newEmail,
    })
    return request
  }
}

export const getPageViewTrackData = (
  msgValue: IKafkaMessageValue,
  headers: CioMessageHeaders,
): Record<string, any> | null | void => {
  stringifyHeaders(headers)

  if (msgValue.data.path) {
    return {
      type: TYPE.PERSON,
      identifiers: getIdentifierFromHeaders(headers),
      action: ACTION.PAGE,
      name: msgValue.data.path,
      timestamp: now,
      attributes: {
        name: msgValue.data.path,
        correlation_id: headers.correlationId,
      },
    }
  }
}

export const getProfileUpdateData = (
  msgValue: IKafkaMessageValue,
  headers: CioMessageHeaders,
): Record<string, any> | null | void => {
  stringifyHeaders(headers)
  const updatedProperties: UpdatedProperties = {}
  if (msgValue.data.newEmail) {
    updatedProperties.email = msgValue.data.newEmail
  }
  if (msgValue.data.emailVerified) {
    updatedProperties.email_verified = msgValue.data.emailVerified
  }
  if (msgValue.data.firstName) {
    updatedProperties.first_name = msgValue.data.firstName
  }
  if (msgValue.data.lastName) {
    updatedProperties.last_name = msgValue.data.lastName
  }
  if (msgValue.data.meta) {
    updatedProperties.meta = msgValue.data.meta
  }
  if (msgValue.data.oldEmail) {
    updatedProperties.old_email = msgValue.data.oldEmail
  }
  if (msgValue.data?.nickname) {
    updatedProperties.nickname = msgValue.data.nickname
  }
  return {
    type: TYPE.PERSON,
    identifiers: getIdentifierFromHeaders(headers),
    action: ACTION.EVENT,
    name: msgValue.eventName,
    timestamp: now,
    attributes: {
      ...updatedProperties,
      correlation_id: headers.correlationId,
    },
  }
}

export const getUserIdentifiedTrackData = (
  msgValue: IKafkaMessageValue,
  headers: CioMessageHeaders,
): Record<string, any> | null | void => {
  stringifyHeaders(headers)
  if (msgValue.data.anonymousId) {
    return {
      type: TYPE.PERSON,
      identifiers: getIdentifierFromHeaders(headers),
      action: ACTION.EVENT,
      name: msgValue.eventName,
      timestamp: now,
      attributes: {
        anonymous_id: msgValue.data.anonymousId,
        correlation_id: headers.correlationId,
      },
    }
  }
}

export const getUserTrackData = (
  msgValue: IKafkaMessageValue,
  headers: CioMessageHeaders,
): Record<string, any> | null | void => {
  stringifyHeaders(headers)

  switch (msgValue.eventName) {
    case EVENTS.AUTH.SIGN_UP_COMPLETED:
      if (msgValue.data.signUpMethod && msgValue.data.signUpSource && msgValue.data.signUpTime) {
        return {
          type: TYPE.PERSON,
          identifiers: getIdentifierFromHeaders(headers),
          action: ACTION.EVENT,
          name: msgValue.eventName,
          timestamp: now,
          attributes: {
            email: msgValue.data?.email,
            sign_up_method: msgValue.data.signUpMethod,
            sign_up_source: msgValue.data.signUpSource,
            referrer_user_id: msgValue.data.referrerUserId,
            first_name: msgValue.data?.firstName,
            last_name: msgValue.data?.lastName,
            created_at: msgValue.data.signUpTime,
            correlation_id: headers.correlationId,
          },
        }
      }
      break
    case EVENTS.AUTH.SIGN_IN_COMPLETED:
      return {
        type: TYPE.PERSON,
        identifiers: getIdentifierFromHeaders(headers),
        action: ACTION.EVENT,
        name: msgValue.eventName,
        timestamp: now,
        attributes: {
          email: msgValue.data.email,
          correlation_id: headers.correlationId,
        },
      }
    case EVENTS.AUTH.SIGN_OUT_COMPLETED:
      return {
        type: TYPE.PERSON,
        identifiers: getIdentifierFromHeaders(headers),
        action: ACTION.EVENT,
        name: msgValue.eventName,
        timestamp: now,
        attributes: {
          correlation_id: headers.correlationId,
        },
      }
    case EVENTS.AUTH.WAITLIST_JOINED:
      return {
        type: TYPE.PERSON,
        identifiers: getIdentifierFromHeaders(headers),
        action: ACTION.EVENT,
        name: msgValue.eventName,
        timestamp: now,
        attributes: {
          invite_code: msgValue.data.inviteCode,
          correlation_id: headers.correlationId,
        },
      }
    default:
      return {
        type: TYPE.PERSON,
        identifiers: getIdentifierFromHeaders(headers),
        action: ACTION.EVENT,
        name: msgValue.eventName,
        timestamp: now,
        attributes: { ...transformKeys(msgValue.data), correlation_id: headers.correlationId },
      }
  }
}
