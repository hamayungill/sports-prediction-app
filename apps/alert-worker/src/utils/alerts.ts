/* eslint-disable @typescript-eslint/no-explicit-any */
import { IKafkaMessageHeaders, IKafkaMessageValue } from '@duelnow/kafka-client'

import { envs } from './envs'
import { logger } from './logger'

// opsgenie does not support typescript
export const opsgenie = require('opsgenie-sdk') /* eslint-disable-line @typescript-eslint/no-var-requires */

opsgenie.configure({
  host: 'https://api.opsgenie.com',
  api_key: envs.opsgenieApiKey,
})

const createAlert = (alert: object): Promise<void> => {
  return new Promise((resolve, reject) => {
    opsgenie.alertV2.create(alert, function (error: any, alert: any) {
      if (error) {
        reject(error)
      }
      logger.info('Create Alert Response:')
      logger.info(alert)
      resolve(alert)
    })
  })
}

export const sendAlert = async (msg: string, headers: IKafkaMessageHeaders | null): Promise<void> => {
  const msgValue = JSON.parse(msg) as IKafkaMessageValue

  switch (headers?.caller?.toString()?.toLowerCase()) {
    case 'airflow':
      opsgenie.configure({
        host: 'https://api.opsgenie.com',
        api_key: envs.opsgenieDataApiKey,
      })
      break
    default:
      opsgenie.configure({
        host: 'https://api.opsgenie.com',
        api_key: envs.opsgenieApiKey,
      })
  }

  const create_alert_json = {
    message: msgValue.data?.message,
    tags: ['kafka', envs.environment],
    details: { ...msgValue?.data?.details, name: msgValue?.eventName },
    description: msgValue?.data?.description || '',
    source: msgValue?.data?.source,
    priority: msgValue?.data?.priority,
  }
  try {
    await createAlert(create_alert_json)
  } catch (error) {
    logger.error('Error: ', error)
  }
}
