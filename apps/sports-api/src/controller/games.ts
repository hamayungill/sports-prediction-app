/* eslint-disable  @typescript-eslint/no-explicit-any */
import { query } from '@duelnow/query-parser'
import { ApiResponse, ErrorType, GetParams, HttpResponseStatus, apiResponse, errorResponse } from '@duelnow/utils'
import { Request as ExprsRqst } from 'express'
import { Controller, Get, Path, Query, Request, Route } from 'tsoa'

import { GamesService } from '../service/games'
import { logger } from '../utils/logger'

@Route('games')
export class GamesController extends Controller {
  @Get('active-weeks/{leagueId}')
  public async getActiveWeeks(@Path() leagueId: string, @Query() betType?: string): Promise<ApiResponse | null> {
    try {
      const response = await new GamesService().getActiveWeeks(parseInt(leagueId), betType)
      return apiResponse(HttpResponseStatus.Ok, response)
    } catch (err) {
      logger.error(`sports-api getActiveWeeks error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{leagueId}')
  public async getGames(@Path() leagueId: string, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const queries = req.query
      const filter = query.getDbQuery(queries)
      const params: GetParams = {}
      if (filter) params.filter = filter

      const games = await new GamesService().getGames(leagueId, params)

      return apiResponse(HttpResponseStatus.Ok, games)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports-api getGames error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('challenges/{inviteCode}')
  public async getGamesInChallenge(@Path() inviteCode: string): Promise<ApiResponse | null> {
    try {
      const response = await new GamesService().getGamesInChallenge(inviteCode)
      return apiResponse(HttpResponseStatus.Ok, response)
    } catch (err) {
      logger.error(`sports-api getGamesInChallenge error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('players/leagues/{leagueId}')
  public async getPlayersInTeam(@Path() leagueId: string, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const queries = req.query
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const filter: Record<string, any> = query.getDbQuery(queries)
      const search = filter?.search?.contains
      const teamId = filter?.teamId?.equals || filter?.teamId?.IN
      const teamIds = typeof teamId === 'number' ? [String(teamId)] : teamId
      const response = await new GamesService().getPlayersInTeam(teamIds, parseInt(leagueId), search)
      return apiResponse(HttpResponseStatus.Ok, response)
    } catch (err) {
      logger.error(`sports-api getPlayersInTeam error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }
}
