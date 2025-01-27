/* eslint-disable @typescript-eslint/no-explicit-any */
import { IKafkaMessageValue } from '@duelnow/kafka-client'
import { EVENTS, parseUserAgent, stringifyHeaders, transformKeys } from '@duelnow/utils'

import { CALLER } from './consts'
import { MixpanelMessageHeaders, MixpanelMessageProperties, UpdatedProperties, UserProperties } from './types'

const getIdentifierFromHeaders = (headers: MixpanelMessageHeaders): Record<string, string> => {
  const callerId = headers.callerId
  const eventProperties: Record<string, string> = {}

  switch (headers.caller) {
    case CALLER.ANONYMOUS:
      eventProperties['$device_id'] = callerId
      break
    default:
      eventProperties['distinct_id'] = callerId
  }

  return eventProperties
}

export const getEmailVerificationData = (
  msgValue: IKafkaMessageValue,
  headers: MixpanelMessageHeaders,
): any | null | void => {
  stringifyHeaders(headers)
  if (headers.caller != CALLER.ANONYMOUS && msgValue.data.newEmail && msgValue.data.emailVerificationLink) {
    return {
      ...getPropertiesFromHeaders(headers),
      email_verification_link: msgValue.data.emailVerificationLink,
      new_email: msgValue.data.newEmail,
    }
  }
}

export const getPageViewTrackData = (
  msgValue: IKafkaMessageValue,
  headers: MixpanelMessageHeaders,
): Record<string, any> | null | void => {
  stringifyHeaders(headers)

  if (msgValue.data.path) {
    const properties: Record<string, any> = {
      ...getPropertiesFromHeaders(headers),
      path: msgValue.data.path,
    }

    return properties
  }
}

export const getProfileUpdateData = (
  msgValue: IKafkaMessageValue,
  headers: MixpanelMessageHeaders,
): Record<string, any> | null | void => {
  stringifyHeaders(headers)
  const updatedProperties: UpdatedProperties = {}
  if (msgValue.data.newEmail) {
    updatedProperties.$email = msgValue.data.newEmail
  }
  if (msgValue.data.emailVerified) {
    updatedProperties.email_verified = msgValue.data.emailVerified
  }
  if (msgValue.data.firstName) {
    updatedProperties.$first_name = msgValue.data.firstName
  }
  if (msgValue.data.lastName) {
    updatedProperties.$last_name = msgValue.data.lastName
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
    ...getPropertiesFromHeaders(headers),
    ...updatedProperties,
  }
}

export const getPropertiesFromHeaders = (headers: MixpanelMessageHeaders): Record<string, any> => {
  const ua = parseUserAgent(headers)

  const properties: MixpanelMessageProperties = {
    ip: headers.ip,
    ...getIdentifierFromHeaders(headers),
    browser: ua?.browser?.name,
    device: ua.device.model,
    os: ua.os.name,
    referer: headers?.referer,
    utm: headers?.utm,
    correlation_id: headers.correlationId || '',
  }

  return properties
}
export const getUserTrackData = (
  msgValue: IKafkaMessageValue,
  headers: MixpanelMessageHeaders,
): Record<string, any> | null | void => {
  stringifyHeaders(headers)
  switch (msgValue.eventName) {
    case EVENTS.AUTH.SIGN_UP_COMPLETED:
      if (msgValue.data.signUpMethod && msgValue.data.signUpSource && msgValue.data.signUpTime) {
        const userProperties: UserProperties = {
          ...getPropertiesFromHeaders(headers),
          $email: msgValue.data?.email,
          sign_up_method: msgValue.data.signUpMethod,
          sign_up_source: msgValue.data.signUpSource,
          referrer_user_id: msgValue.data.referrerUserId,
          $created: msgValue.data.signUpTime,
        }
        if (msgValue.data.firstName) {
          userProperties.$first_name = msgValue.data.firstName
        }

        if (msgValue.data.lastName) {
          userProperties.$last_name = msgValue.data.lastName
        }

        return userProperties
      }
      break
    case EVENTS.AUTH.SIGN_IN_COMPLETED:
      return {
        ...getPropertiesFromHeaders(headers),
        email: msgValue.data.email,
      }
    case EVENTS.AUTH.SIGN_OUT_COMPLETED:
      return {
        ...getPropertiesFromHeaders(headers),
      }
    default:
      return {
        ...getPropertiesFromHeaders(headers),
        ...transformKeys(msgValue.data),
      }
  }
}

export const getWaitlistJoinedTrackData = (
  msgValue: IKafkaMessageValue,
  headers: MixpanelMessageHeaders,
): Record<string, any> | null | void => {
  stringifyHeaders(headers)

  return {
    ...getPropertiesFromHeaders(headers),
    invite_code: msgValue.data.inviteCode,
  }
}
