/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import {
  ApiResponse,
  ErrorType,
  HttpResponseStatus,
  UpdateChallengeMode,
  apiResponse,
  errorResponse,
} from '@duelnow/utils'
import { Request as ExprsRqst } from 'express'
import { Body, Controller, Get, Header, Patch, Path, Request, Route, Security, Tags } from 'tsoa'

import { ChallengesService } from '../../service/challenges'
import { logger } from '../../utils/logger'
import { AuthenticatedRequest } from '../../utils/types'

@Route('v1/challenges')
export class ChallengesController extends Controller {
  @Get('public')
  @Tags('Challenges')
  public async listPublicChallenges(@Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().listPublicChallenges(req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`listPublicChallenges error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('contracts')
  @Tags('Challenges')
  public async getContracts(
    @Request() req: ExprsRqst,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().getContracts(req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getContracts error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{inviteCode}/metrics/{userId}')
  @Security('bearerAuth')
  @Tags('Challenges')
  public async getChallengeMetrics(
    @Path() inviteCode: string,
    @Path() userId: string,
    @Request() req: ExprsRqst,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().getChallengeMetrics(inviteCode, userId, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getChallengeMetrics error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{inviteCode}/lineups/{challengeResultId}')
  @Security('bearerAuth')
  @Tags('Challenges')
  public async getPickemChallengeLineups(
    @Path() inviteCode: string,
    @Path() challengeResultId: string,
    @Request() req: ExprsRqst,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().getPickemChallengeLineups(
        inviteCode,
        challengeResultId,
        req.headers,
      )
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getPickemChallengeLineups error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('requests')
  @Security('bearerAuth')
  public async getPartialBetEvents(
    @Request() req: AuthenticatedRequest,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const partialBetEvents = await new ChallengesService().getPartialBetEvents(req.query, req.headers)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, partialBetEvents.data)
    } catch (err) {
      logger.error(`exposed-api get partial bet events returns error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{userId}')
  @Security('bearerAuth')
  @Tags('Challenges')
  public async getUserChallenges(
    @Path() userId: string,
    @Request() req: ExprsRqst,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().getUserChallenges(userId, req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getUserChallenges error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('{challengeId}/requests')
  @Security('bearerAuth')
  @Tags('Sports')
  public async updateChallengeMode(
    @Path() challengeId: string,
    @Request() req: AuthenticatedRequest,
    @Body() requestBody: UpdateChallengeMode,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const updateChallengeMode = await new ChallengesService().updateChallengeMode(
        req.headers,
        requestBody,
        challengeId,
      )
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, updateChallengeMode.data)
    } catch (err) {
      logger.error(`exposed-api update challenge mode error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{inviteCode}/participants')
  @Security('bearerAuth')
  @Tags('Challenges')
  public async getChallengeParticipants(
    @Path() inviteCode: string,
    @Request() req: ExprsRqst,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().getChallengeParticipants(inviteCode, req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getChallengeParticipants error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{inviteCode}/leaderboard/{challengeResultId}')
  @Security('bearerAuth')
  @Tags('Challenges')
  public async getChallengeLeaderboard(
    @Path() inviteCode: string,
    @Path() challengeResultId: string,
    @Request() req: ExprsRqst,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().getChallengeLeaderboard(inviteCode, challengeResultId, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getChallengeLeaderboard error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('leagues/{leagueId}')
  @Security('bearerAuth')
  @Tags('Challenges')
  public async getPublicChallenges(@Path() leagueId: string, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().getPublicChallenges(leagueId, req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getPublicChallenges error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('categories/games/{gameId}')
  @Security('bearerAuth')
  @Tags('Challenges')
  public async getCategoriesInGame(@Path() gameId: string, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().getCategoriesInGame(gameId, req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getCategoriesInGame error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('categories/{categoryId}/groups')
  @Security('bearerAuth')
  @Tags('Challenges')
  public async getGroupsInCategory(@Path() categoryId: string, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const response = await new ChallengesService().getGroupsInCategory(categoryId, req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`getGroupsInCategory error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('groups/{groupId}/subgroups')
  @Security('bearerAuth')
  @Tags('Challenges')
  public async getSubgroupsInGroups(@Path() groupId: string, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const groups = await new ChallengesService().getSubgroupsInGroups(groupId, req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, groups)
    } catch (err) {
      logger.error(`getSubgroupsInGroups error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }
}
