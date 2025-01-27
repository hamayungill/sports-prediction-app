/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import { ApiResponse, ErrorType, HttpResponseStatus, apiResponse, errorResponse } from '@duelnow/utils'
import { Request as ExprsRqst } from 'express'
import { Controller, Get, Header, Request, Route, Security, Tags } from 'tsoa'

import { QuestService } from '../../service/quests'
import { logger } from '../../utils/logger'

@Route('v1/quests')
export class QuestController extends Controller {
  @Get('')
  @Security('bearerAuth')
  @Tags('quests')
  public async getQuests(
    @Request() req: ExprsRqst,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new QuestService().getQuests(req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getQuests error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('stats/me')
  @Security('bearerAuth')
  @Tags('quests')
  public async getUserQuestStats(
    @Request() req: ExprsRqst,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new QuestService().getUserQuestStats(req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getUserQuestStats error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }
}
