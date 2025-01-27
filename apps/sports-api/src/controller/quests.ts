/* eslint-disable  @typescript-eslint/no-explicit-any */
import { Paginator, query } from '@duelnow/query-parser'
import { ApiResponse, ErrorType, GetParams, HttpResponseStatus, apiResponse, errorResponse } from '@duelnow/utils'
import { Request as ExprsRqst } from 'express'
import { Controller, Get, Request, Route } from 'tsoa'

import { QuestService } from '../service/quests'
import { logger } from '../utils/logger'

@Route('quests')
export class QuestController extends Controller {
  @Get('')
  public async getQuests(@Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const queries = req.query
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const filter: Record<string, any> = query.getDbQuery(queries)
      const sort = typeof queries?.sort === 'string' ? query.getDbQuerySort({ sort: queries.sort }) : null
      const params: GetParams = {}
      if (filter) params.filter = filter
      if (sort) params.sort = sort

      const cursor = typeof queries?.cursor === 'string' ? queries?.cursor : undefined
      const limit = typeof queries?.limit === 'string' ? queries?.limit : '25'
      const pagination = new Paginator({ cursor, limit: limit })
      params.take = parseInt(limit)
      params.skip = pagination.decoded.skip
      const { data, count } = await new QuestService().getQuests(params)
      const nextCursor = pagination.getNextCursor(count)
      return apiResponse(HttpResponseStatus.Ok, { quest: data, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      logger.error(`quests controller getQuests error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('stats/me')
  public async getUserQuestStats(@Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      let externalUserId = req.headers?.accountid
      externalUserId = typeof externalUserId === 'string' ? externalUserId : ''
      const queries = req.query
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const filter: Record<string, any> = query.getDbQuery(queries)
      const sort = typeof queries?.sort === 'string' ? query.getDbQuerySort({ sort: queries.sort }) : null
      const params: GetParams = {}
      if (filter) params.filter = filter
      if (sort) params.sort = sort

      const cursor = typeof queries?.cursor === 'string' ? queries?.cursor : undefined
      const limit = typeof queries?.limit === 'string' ? queries?.limit : '25'
      const pagination = new Paginator({ cursor, limit: limit })
      params.take = parseInt(limit)
      params.skip = pagination.decoded.skip
      const { data, count } = await new QuestService().getUserQuestStats(externalUserId, params)
      const nextCursor = pagination.getNextCursor(count)
      return apiResponse(HttpResponseStatus.Ok, { ...data, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      logger.error(`quests controller getUserQuestStats error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }
}
