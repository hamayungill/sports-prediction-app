import { Paginator, query } from '@duelnow/query-parser'
import {
  ApiResponse,
  ErrorType,
  GetParams,
  HttpResponseStatus,
  UpdateChallengeMode,
  apiResponse,
  errorResponse,
} from '@duelnow/utils'
import { Request as ExprsRqst } from 'express'
import { Body, Controller, Get, Patch, Path, Request, Route } from 'tsoa'

import { ChallengesService } from '../service/challenges'
import { logger } from '../utils/logger'

@Route('challenges')
export class ChallengesController extends Controller {
  @Get('public')
  public async listPublicChallenges(@Request() req: ExprsRqst): Promise<ApiResponse | null> {
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

      let leagueId = filter?.leagueId?.equals
      leagueId = leagueId ? parseInt(leagueId) : null
      const externalUserId = filter?.externalUserId?.equals

      params.take = parseInt(limit)
      params.skip = pagination.decoded.skip

      const { data, count } = await new ChallengesService().getPublicChallenges(params, leagueId, externalUserId)
      const nextCursor = pagination.getNextCursor(count)
      return apiResponse(HttpResponseStatus.Ok, { challenges: data, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      logger.error(`sports-api listPublicChallenges error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('contracts')
  public async getContracts(@Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const queries = req.query
      const filter = query.getDbQuery(queries)
      const sort = typeof queries?.sort === 'string' ? query.getDbQuerySort({ sort: queries.sort }) : null
      const params: GetParams = {}
      if (filter) params.filter = filter
      if (sort) params.sort = sort

      const cursor = typeof queries?.cursor === 'string' ? queries?.cursor : undefined
      const limit = typeof queries?.limit === 'string' ? queries?.limit : '25'
      const pagination = new Paginator({ cursor, limit: limit })

      params.take = parseInt(limit)
      params.skip = pagination.decoded.skip
      const { data, count } = await new ChallengesService().getContracts(params)
      const nextCursor = pagination.getNextCursor(count)

      return apiResponse(HttpResponseStatus.Ok, { contracts: data, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports-api getContracts error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('{inviteCode}/metrics/{userId}')
  public async getChallengeMetrics(@Path() inviteCode: string, @Path() userId: string): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().getChallengeMetrics(inviteCode, userId)
      return apiResponse(HttpResponseStatus.Ok, response)
    } catch (err) {
      logger.error(`sports-api getChallengeMetrics error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('{inviteCode}/lineups/{challengeResultId}')
  public async getPickemChallengeLineups(
    @Path() inviteCode: string,
    @Path() challengeResultId: string,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().getPickemChallengeLineups(inviteCode, parseInt(challengeResultId))
      return apiResponse(HttpResponseStatus.Ok, response)
    } catch (err) {
      logger.error(`sports-api getPickemChallengeLineups error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('requests')
  public async getPartialBetEvents(@Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      let userId = req.headers['caller-id']
      userId = typeof userId === 'string' ? userId : ''
      const partialBetEvents = await new ChallengesService().getPartialBetEvents(userId, req.query)
      return apiResponse(HttpResponseStatus.Ok, partialBetEvents)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports-api get partial bet events returns error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{userId}')
  public async getUserChallenges(@Path() userId: string, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const queries = req.query
      const filter = query.getDbQuery(queries)
      const sort = typeof queries?.sort === 'string' ? query.getDbQuerySort({ sort: queries.sort }) : null
      const params: GetParams = {}
      if (filter) params.filter = filter
      if (sort) {
        let challengeSort: object = {}
        // As the startDate is part of challenges table we need to pass it as relational sort so converting it.
        if (sort?.startDate) {
          challengeSort = {
            challenges: {
              startDate: sort.startDate,
            },
          }
          delete sort.startDate
        }
        params.sort = { ...sort, ...challengeSort }
      }

      const cursor = typeof queries?.cursor === 'string' ? queries?.cursor : undefined
      const limit = typeof queries?.limit === 'string' ? queries?.limit : '25'
      const pagination = new Paginator({ cursor, limit: limit })

      params.take = parseInt(limit)
      params.skip = pagination.decoded.skip
      const { data, count } = await new ChallengesService().getUserChallenges(userId, params)
      const nextCursor = pagination.getNextCursor(count)
      return apiResponse(HttpResponseStatus.Ok, { challenges: data, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      logger.error(`sports-api getUserChallenges error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Patch('{challengeId}/requests')
  public async updateChallengeMode(
    @Path() challengeId: string,
    @Request() req: ExprsRqst,
    @Body() requestBody: UpdateChallengeMode,
  ): Promise<ApiResponse | null> {
    try {
      const updateChallengeMode = await new ChallengesService().UpdateChallengeMode(
        requestBody,
        req.headers,
        challengeId,
      )
      return apiResponse(HttpResponseStatus.Ok, updateChallengeMode)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports - api update challenge mode error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{inviteCode}/participants')
  public async getChallengeParticipants(
    @Path() inviteCode: string,
    @Request() req: ExprsRqst,
  ): Promise<ApiResponse | null> {
    try {
      const queries = req.query
      const filter = query.getDbQuery(queries)
      const sort = typeof queries?.sort === 'string' ? query.getDbQuerySort({ sort: queries.sort }) : null
      const params: GetParams = {}
      if (filter) params.filter = filter
      if (sort) params.sort = sort

      const cursor = typeof queries?.cursor === 'string' ? queries?.cursor : undefined
      const limit = typeof queries?.limit === 'string' ? queries?.limit : '25'
      const pagination = new Paginator({ cursor, limit: limit })

      params.take = parseInt(limit)
      params.skip = pagination.decoded.skip
      const { data, count } = await new ChallengesService().getChallengeParticipants(inviteCode, params)
      const nextCursor = pagination.getNextCursor(count)
      return apiResponse(HttpResponseStatus.Ok, { partcipants: data, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      logger.error(`sports-api getChallengeParticipants error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('{inviteCode}/leaderboard/{challengeResultId}')
  public async getChallengeLeaderboard(
    @Path() inviteCode: string,
    @Path() challengeResultId: string,
    @Request() req: ExprsRqst,
  ): Promise<ApiResponse | null> {
    try {
      const queries = req.query
      const params: GetParams = {}

      const cursor = typeof queries?.cursor === 'string' ? queries?.cursor : undefined
      const limit = typeof queries?.limit === 'string' ? queries?.limit : '25'
      const pagination = new Paginator({ cursor, limit: limit })

      params.take = parseInt(limit)
      params.skip = pagination.decoded.skip
      const { data, count } = await new ChallengesService().getChallengeLeaderboard(
        inviteCode,
        parseInt(challengeResultId),
        params,
      )
      const nextCursor = pagination.getNextCursor(count)
      return apiResponse(HttpResponseStatus.Ok, { ...data, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      logger.error(`sports-api getChallengeLeaderboard error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('leagues/{leagueId}')
  public async getPublicChallenges(@Path() leagueId: string, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      let externalUserId = req.headers?.accountid
      externalUserId = typeof externalUserId === 'string' ? externalUserId : ''
      const queries = req.query
      const filter = query.getDbQuery(queries)
      const sort = typeof queries?.sort === 'string' ? query.getDbQuerySort({ sort: queries.sort }) : null
      const params: GetParams = {}
      if (filter) params.filter = filter
      if (sort) params.sort = sort

      const cursor = typeof queries?.cursor === 'string' ? queries?.cursor : undefined
      const limit = typeof queries?.limit === 'string' ? queries?.limit : '25'
      const pagination = new Paginator({ cursor, limit: limit })

      params.take = parseInt(limit)
      params.skip = pagination.decoded.skip
      const { data, count } = await new ChallengesService().getPublicChallenges(
        params,
        parseInt(leagueId),
        externalUserId,
      )
      const nextCursor = pagination.getNextCursor(count)
      return apiResponse(HttpResponseStatus.Ok, { challenges: data, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      logger.error(`sports-api getPublicChallenges error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('categories/games/{gameId}')
  public async getCategoriesInGame(@Path() gameId: string): Promise<ApiResponse | null> {
    try {
      const categories = await new ChallengesService().getCategoriesInGame(parseInt(gameId))
      return apiResponse(HttpResponseStatus.Ok, categories)
    } catch (err) {
      logger.error(`sports-api getCategoriesInGame error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('categories/{categoryId}/groups')
  public async getGroupsInCategory(@Path() categoryId: string, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const queries = req.query
      const filter = query.getDbQuery(queries)
      const groups = await new ChallengesService().getGroupsInCategory(parseInt(categoryId), filter)
      return apiResponse(HttpResponseStatus.Ok, groups)
    } catch (err) {
      logger.error(`sports-api getGroupsInCategory error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('groups/{groupId}/subgroups')
  public async getSubgroupsInGroups(@Path() groupId: string): Promise<ApiResponse | null> {
    try {
      const groups = await new ChallengesService().getSubgroupsInGroups(parseInt(groupId))
      return apiResponse(HttpResponseStatus.Ok, groups)
    } catch (err) {
      logger.error(`sports-api getSubgroupsInGroups error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }
}
