/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import { IKafkaMessage } from '@duelnow/kafka-client'
import { ApiResponse, ErrorType, HttpResponseStatus, apiResponse, errorResponse } from '@duelnow/utils'
import { Request as ExprsRqst } from 'express'
import { Body, Controller, Header, Middlewares, Post, Request, Route, Tags } from 'tsoa'

import { KAFKA } from '../../utils/const'
import { producer } from '../../utils/kafkaProducer'
import { logger } from '../../utils/logger'
import { restrictDomain } from '../../utils/middleware'
import type { trackBody } from '../../utils/types'

@Route('v1/track')
export class TrackController extends Controller {
  @Post()
  @Middlewares(restrictDomain)
  @Tags('Tracking')
  public async trackPages(
    @Request() req: ExprsRqst,
    @Body() _requestBody: trackBody,
    @Header('Caller') _caller: string,
    @Header('Caller-Id') _callerId: string,
    @Header('User-Agent') _userAgent: string,
  ): Promise<ApiResponse | null | void> {
    try {
      const { event } = req.body

      if (!event || !event.name || !event.data || !event.data.path) {
        throw new Error('Invalid request body')
      }
      // prettier-ignore
      logger.info(
        `Sending page view track to Mixpanel: Data=${JSON.stringify(event.data)} Headers=${JSON.stringify(req.headers)} `,
      )
      const udid = req.headers['Udid'] || req.headers['udid'] || ''
      const kafkaMessage: IKafkaMessage = {
        key: String(udid),
        value: {
          eventName: event.name,
          data: event.data,
        },
      }
      await producer.sendMessage(KAFKA.TOPICS.TRACKING_USER_EVENTS, kafkaMessage, req.headers)
      logger.info(`${event.name}: Mixpanel event success`)

      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok)
    } catch (err) {
      logger.error(`exposed-api sendTrackMessage error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }
}
