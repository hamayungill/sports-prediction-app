import { IKafkaMessage, sendAlert } from '@duelnow/kafka-client'
import { AlertPriority, EVENTS, TOPICS, WORKERS } from '@duelnow/utils'
import { v4 as uuidv4 } from 'uuid'

import { findUserByWallet, getEligibleMembershipLevel } from '../service/database'

import { logger, producer } from './index'

export const checkMembership = async (balance: string, walletAddress: string): Promise<void> => {
  const membershipLevel = await getEligibleMembershipLevel(balance)
  if (membershipLevel) {
    const user = await findUserByWallet(walletAddress)
    if (user) {
      if (user?.membershipLevelId !== membershipLevel?.levelId) {
        await produceMessage(membershipLevel.levelId, user?.userId)
      } else {
        logger.info(`User membership level won't be updated because the level didn't changed`)
      }
    } else {
      logger.warn(`User not found against the wallet address: ${walletAddress}`)
    }
  } else {
    logger.error(`Membership level does't exist for balance: ${balance}`)
    const message = `Critical: Membership level does't exist for balance: ${balance}`
    const error = `The balance of ${balance} does not meet any membership criteria.`
    await sendAlertTrigger(message, error, AlertPriority.Critical)
  }
}

export const produceMessage = async (levelId: number, userId: string): Promise<void> => {
  const kafkaMessage: IKafkaMessage = {
    key: String(userId),
    value: {
      eventName: EVENTS.TRACKING.PROFILE_UPDATED,
      data: {
        levelId,
      },
    },
  }

  const kafkaHeaders = { callerId: userId, caller: 'system', correlationId: uuidv4() }

  producer.sendMessage(TOPICS.USER.USER.USERS, kafkaMessage, kafkaHeaders)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendAlertTrigger = async (message: string, error: any, priority: AlertPriority): Promise<void> => {
  // throws different level alerts, based on certain conditions
  const alertMessage: IKafkaMessage = {
    key: uuidv4(),
    value: {
      eventName: '',
      data: {
        message,
        priority,
        source: WORKERS.WEB3,
        details: {
          error,
          headers: '',
        },
      },
    },
  }
  await sendAlert(alertMessage)
}
