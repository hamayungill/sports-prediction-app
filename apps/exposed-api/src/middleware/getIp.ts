import { getIpInfo, isLocationBlocked, storeIpData } from '@duelnow/ip-info'
import { IKafkaMessage } from '@duelnow/kafka-client'
import { EVENTS, ErrorDetail, ErrorType, HttpResponseStatus, TOPICS, errorResponse, isLocal } from '@duelnow/utils'
import { NextFunction, Request, Response } from 'express'

import { producer } from '../utils/kafkaProducer'
import { logger } from '../utils/logger'

export const getIp = async (
  req: Request,
  res: Response,
  next: NextFunction,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<void | Response<any, Record<string, any>>> => {
  if (isLocal() || req?.path?.toLowerCase() === '/healthz') {
    next()
  } else {
    logger.debug('IP middleware getInfo headers', req.headers)
    const caller = req.headers['caller'] as string
    const callerId = req.headers['caller-id'] as string
    const correlationId = req.headers['correlation-id'] as string
    let ip =
      req.headers['cf-connecting-ip'] ||
      req.headers['X-Client-IP'] ||
      req.headers['x-real-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      ''

    logger.debug('IP middleware getting IPs', ip)

    /**
     * x-forwarded-for will have client ip in first place so, if the ip is array in the below step
     * collecting client ip address from the array.
     * */
    if (Array.isArray(ip)) ip = ip[0]
    if (ip.includes(',')) {
      ip = ip.split(',')[0]?.trim()
    }
    if (!ip) {
      return res
        .status(HttpResponseStatus.BadRequest)
        .json(errorResponse(ErrorType.MissingRequiredField, HttpResponseStatus.BadRequest))
    } else {
      try {
        const ipData = await getIpInfo(ip)
        logger.debug('IP middleware getIpInfo response', ipData)
        if (ipData?.ip && ipData.country_name) {
          const country = ipData?.country_code?.toUpperCase()
          const region = ipData?.region?.toUpperCase()
          const city = ipData?.city?.toUpperCase()
          storeIpData(ipData)
          const isBlocked = await isLocationBlocked(country, region, city)
          logger.info('IP middleware is IP blocked?', isBlocked)

          // check if this IP is allowed
          if (isBlocked) {
            logger.warn(
              'IP middleware forbidden response',
              errorResponse(ErrorType.IpBlocked, HttpResponseStatus.Forbidden),
            )
            // send kafka message
            if (caller && callerId) {
              const message: IKafkaMessage = {
                key: String(correlationId),
                value: {
                  eventName: EVENTS.TRACKING.REQUEST_BLOCKED,
                  data: {
                    requestMethod: req.method,
                    requestPath: req.url,
                    ip,
                    sucess: false,
                    errorMessage: `IP Location is blacklisted - country: ${country}, region: ${region}, city: ${city}.`,
                  },
                },
              }
              await producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, message, { ...req.headers })
            }
            return res
              .status(HttpResponseStatus.Forbidden)
              .json(errorResponse(ErrorType.IpBlocked, HttpResponseStatus.Forbidden))
          }

          logger.info('IP middleware IP is allowed')
          next()
        } else {
          logger.warn('IP middleware forbidden response: IP or country name not found', ipData)
          // send kafka message
          if (caller && callerId) {
            const message: IKafkaMessage = {
              key: String(correlationId),
              value: {
                eventName: EVENTS.TRACKING.REQUEST_BLOCKED,
                data: {
                  requestMethod: req.method,
                  requestPath: req.url,
                  ip,
                  sucess: false,
                  errorMessage: `IP or country_name not found in the ipData response`,
                },
              },
            }
            await producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, message, { ...req.headers })
          }
          return res
            .status(HttpResponseStatus.Forbidden)
            .json(errorResponse(ErrorType.InvalidIPaddresss, HttpResponseStatus.Forbidden))
        }
      } catch (err) {
        logger.error(`${ip} is invalid IP address!`, err)

        // send kafka message
        if (caller && callerId) {
          const message: IKafkaMessage = {
            key: String(correlationId),
            value: {
              eventName: EVENTS.TRACKING.REQUEST_BLOCKED,
              data: {
                requestMethod: req.method,
                requestPath: req.url,
                ip,
                sucess: false,
                errorMessage: ErrorDetail[ErrorType.InvalidIPaddresss],
              },
            },
          }
          await producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, message, { ...req.headers })
        }
        return res
          .status(HttpResponseStatus.Forbidden)
          .json(errorResponse(ErrorType.InvalidIPaddresss, HttpResponseStatus.Forbidden))
      }
    }
  }
}
