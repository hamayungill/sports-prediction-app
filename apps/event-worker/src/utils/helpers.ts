/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from '@duelnow/database'
import { getIpInfo, storeIpData } from '@duelnow/ip-info'
import { IKafkaMessageHeaders, IKafkaMessageValue } from '@duelnow/kafka-client'
import UAParser from 'ua-parser-js'
import { v4 as uuidv4 } from 'uuid'

import { logger } from './logger'

export const createDataFromMessage = async (
  val: string,
  headers: IKafkaMessageHeaders,
): Promise<Prisma.Prisma.EventsUncheckedCreateInput> => {
  const msgValue = JSON.parse(val) as IKafkaMessageValue

  Object.keys(headers).forEach((key) => {
    headers[key] = headers[key]?.toString()
  })

  logger.debug('message data value', msgValue)
  logger.debug('message data headers', headers)

  const parser = new UAParser()
  const ua = parser.setUA(headers.ua).getResult()
  const locationId = await getLocationId(headers.ip)
  const success = msgValue?.data?.success || true
  const errorMessage = msgValue?.data?.errorMessage

  delete msgValue?.data?.success
  delete msgValue?.data?.errorMessage

  const data = {
    correlationId: headers.correlationId,
    userId: headers.callerId,
    eventName: msgValue.eventName,
    eventCaller: headers.caller,
    data: msgValue.data,
    locationId,
    userAgent: headers.ua || 'unknown',
    browser: (ua.browser.name as string) || 'unknown',
    device: (ua.device.model as string) || 'unknown',
    os: (ua.os.name as string) || 'unknown',
    success,
    errorMessage,
  }
  if (data.correlationId === '') {
    const uuid = uuidv4()
    logger.info('Correlation ID not specified, creating a new one', uuid)
    data.correlationId = uuid
  }
  logger.debug('Data from message', data)
  return data
}

export const getLocationId = async (ip: string): Promise<number> => {
  logger.info('Getting location IP for ', ip)

  // If IP is invalid or missing, return -1 so it doesn't break event-worker processes
  if (!ip) {
    return -1
  }

  try {
    const info = await getIpInfo(ip)

    if (info?.ip) {
      const infoRecord = await storeIpData(info)
      return infoRecord?.locationId ?? -2
    } else {
      return -3
    }
  } catch (error) {
    logger.error('Failed to get location ID', error)
    return -4
  }
}
