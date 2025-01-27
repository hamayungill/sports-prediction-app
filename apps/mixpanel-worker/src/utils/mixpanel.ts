/* eslint-disable @typescript-eslint/no-explicit-any */
import Mixpanel from 'mixpanel'

import { MIXPANEL } from './consts'
import { getPropertiesFromHeaders } from './mapping'
import { MixpanelMessageHeaders } from './types'

import { logger } from './index'

const mixpanel = Mixpanel.init(`${MIXPANEL.api.project_token}`, { geolocate: false })

export const identifyUser = async (eventName: string, anonymous_id: string, headers: any): Promise<void> => {
  const header = getPropertiesFromHeaders(headers)
  mixpanel.people.set(header.distinct_id, { distinct_id: header.distinct_id })
  mixpanel.alias(header.distinct_id, anonymous_id)
  logger.info('Finished alising anonymous user')
  mixpanel.track(eventName, { distinct_id: header.distinct_id })
}

export const trackAnonymousUser = async (eventName: string, headers: MixpanelMessageHeaders): Promise<void> => {
  mixpanel.track(eventName, { distinct_id: headers.callerId })
}

export const trackAnonymousWaitlistJoinerEvent = async (
  eventName: string,
  data: Record<string, any>,
): Promise<void> => {
  mixpanel.track(eventName, { distinct_id: data.callerId, invite_code: data.invite_code })
}

export const trackEvent = async (eventName: string, properties: Record<string, any>): Promise<void> => {
  if (properties.$email !== undefined) {
    mixpanel.people.set(properties.distinct_id, { $email: properties.$email, $name: properties.$first_name })
    mixpanel.people.set_once(properties.distinct_id, {
      terms_of_use: properties?.meta?.terms || {
        v1_0_0: false,
      },
    })
  } else {
    if (properties.$first_name) {
      mixpanel.people.set(properties.distinct_id, { $name: properties.$first_name })
    }
    if (properties.meta) {
      mixpanel.people.set(properties.distinct_id, { terms_of_use: properties.meta })
    }

    if (properties?.invite_code) {
      logger.debug(`Invite code for waitlist joined event ${properties?.invite_code}`)
      mixpanel.people.set(properties.distinct_id, { invite_code: properties.invite_code })
    }
    mixpanel.people.set(properties.distinct_id, { distinct_id: properties.distinct_id })
    mixpanel.people.set_once(properties.distinct_id, {
      terms_of_use: properties?.meta?.terms || {
        v1_0_0: false,
      },
    })
  }
  await mixpanel.track(eventName, properties)
}

export default mixpanel
