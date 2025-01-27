/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import { ApiResponse, ErrorType, HttpResponseStatus, apiResponse, errorResponse } from '@duelnow/utils'
import { Request as ExprsRqst } from 'express'
import { Controller, Get, Header, Path, Query, Request, Route, Security, Tags } from 'tsoa'

import { GamesService } from '../../service/games'
import { logger } from '../../utils/logger'
import { BetTypes } from '../../utils/types'

@Route('v1/games')
export class GamesController extends Controller {
  @Get('active-weeks/{leagueId}')
  @Security('bearerAuth')
  @Tags('Games')
  public async getActiveWeeks(
    @Path() leagueId: string,
    @Request() req: ExprsRqst,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
    @Query('betType') _betType: BetTypes,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new GamesService().getActiveWeeks(leagueId, req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getActiveWeeks error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{leagueId}')
  @Security('bearerAuth')
  @Tags('Games')
  public async getGamesByLeagueId(
    @Path() leagueId: string,
    @Request() req: ExprsRqst,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new GamesService().getGames(leagueId, req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getGames error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('challenges/{inviteCode}')
  @Security('bearerAuth')
  @Tags('Games')
  public async getGamesInChallenge(
    @Path() inviteCode: string,
    @Request() req: ExprsRqst,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new GamesService().getGamesInChallenge(inviteCode, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getGamesInChallenge error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('players/leagues/{leagueId}')
  @Security('bearerAuth')
  @Tags('Games')
  public async getPlayersInTeam(
    @Path() leagueId: string,
    @Request() req: ExprsRqst,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new GamesService().getPlayersInTeam(leagueId, req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getPlayersInTeam error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }
}
