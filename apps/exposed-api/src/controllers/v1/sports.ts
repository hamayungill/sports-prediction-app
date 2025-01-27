/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import {
  ApiResponse,
  CreateChallenge,
  ErrorType,
  HttpResponseStatus,
  JoinChallenge,
  JoinChallengeForm,
  SmartContractResponse,
  UpdateChallengeType,
  UpdateTiebreaker,
  UpsertFavorites,
  UpsertLineups,
  UpstakeTokenQty,
  apiResponse,
  errorResponse,
} from '@duelnow/utils'
import { Request as ExprsRqst } from 'express'
import { Body, Controller, Delete, Get, Header, Patch, Path, Post, Request, Route, Security, Tags } from 'tsoa'

import { SportsService } from '../../service/sports'
import { logger } from '../../utils/logger'
import { AuthenticatedRequest } from '../../utils/types'

@Route('v1/sports')
export class SportsController extends Controller {
  @Post('challenges')
  @Security('bearerAuth')
  @Tags('Sports')
  public async createChallenge(
    @Request() req: AuthenticatedRequest,
    @Body() requestBody: CreateChallenge,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const createChallenge = await new SportsService().createChallenge(req.headers, requestBody)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, createChallenge.data)
    } catch (err) {
      logger.error(`exposed-api createChallenge error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Post('challenges/{challengeId}')
  @Security('bearerAuth')
  @Tags('Sports')
  public async joinChallenge(
    @Request() req: AuthenticatedRequest,
    @Body() requestBody: JoinChallenge,
    @Path() challengeId: number,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const joinChallenge = await new SportsService().joinChallenge(req.headers, requestBody, challengeId)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, joinChallenge.data)
    } catch (err) {
      logger.error(`exposed-api joinChallenge error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('lineups')
  @Security('bearerAuth')
  @Tags('Sports')
  public async upsertLineups(
    @Request() req: AuthenticatedRequest,
    @Body() requestBody: UpsertLineups,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const upsertLineups = await new SportsService().upsertLineups(req.headers, requestBody)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, upsertLineups.data)
    } catch (err) {
      logger.error(`exposed-api upsertLineups error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get()
  @Tags('Sports')
  public async getSports(@Request() req: AuthenticatedRequest): Promise<ApiResponse | null> {
    try {
      const sports = await new SportsService().getSports(req.query, req.headers)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, sports.data)
    } catch (err) {
      logger.error(`exposed-api getSports error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('default-odds')
  @Security('bearerAuth')
  @Tags('Sports')
  public async getDefaultOdds(
    @Request() req: AuthenticatedRequest,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const defaultOdds = await new SportsService().getDefaultOdds(req.query, req.headers)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, defaultOdds.data)
    } catch (err) {
      logger.error(`exposed-api get default odds error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Post('join-challenge-form')
  @Security('bearerAuth')
  @Tags('Sports')
  public async joinChallengeForm(
    @Request() req: AuthenticatedRequest,
    @Body() requestBody: JoinChallengeForm,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const joinChallengeForm = await new SportsService().joinChallengeForm(req.headers, requestBody)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, joinChallengeForm.data)
    } catch (err) {
      logger.error(`exposed-api joinChallengeForm error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('tiebreaker')
  @Security('bearerAuth')
  @Tags('Sports')
  public async updateTiebreaker(
    @Request() req: AuthenticatedRequest,
    @Body() requestBody: UpdateTiebreaker,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const updateTiebreaker = await new SportsService().updateTiebreaker(req.headers, requestBody)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, updateTiebreaker.data)
    } catch (err) {
      logger.error(`exposed-api update tiebreaker error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('challenges/type')
  @Security('bearerAuth')
  @Tags('Sports')
  public async updateChallengeType(
    @Request() req: AuthenticatedRequest,
    @Body() requestBody: UpdateChallengeType,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const updateChallengeType = await new SportsService().updateChallengeType(req.headers, requestBody)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, updateChallengeType.data)
    } catch (err) {
      logger.error(`exposed-api update challenge type error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('challenges/smartcontract')
  @Security('bearerAuth')
  @Tags('Sports')
  public async smartContractResponse(
    @Request() req: AuthenticatedRequest,
    @Body() requestBody: SmartContractResponse,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const smartContractResponse = await new SportsService().smartContractResponse(req.headers, requestBody)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, smartContractResponse.data)
    } catch (err) {
      logger.error(`exposed-api smart contract response error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('challenges/cancel/{challengeId}')
  @Security('bearerAuth')
  @Tags('Sports')
  public async cancelChallenge(
    @Request() req: AuthenticatedRequest,
    @Path() challengeId: number,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const cancelChallenge = await new SportsService().cancelChallenge(req.headers, challengeId)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, cancelChallenge.data)
    } catch (err) {
      logger.error(`exposed-api cancel challenge response error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('challenges/favorites')
  @Security('bearerAuth')
  @Tags('Sports')
  public async getFavorites(
    @Request() req: ExprsRqst,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const response = await new SportsService().getFavorites(req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, response.data)
    } catch (err) {
      logger.error(`exposed-api get favorites response error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('challenges/favorites')
  @Security('bearerAuth')
  @Tags('Sports')
  public async updateFavorites(
    @Request() req: AuthenticatedRequest,
    @Body() requestBody: UpsertFavorites,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const updateFavorites = await new SportsService().updateFavorites(req.headers, requestBody)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, updateFavorites.data)
    } catch (err) {
      logger.error(`exposed-api update favorites response error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('potential-returns')
  @Security('bearerAuth')
  @Tags('Sports')
  public async getPotentialReturns(
    @Request() req: AuthenticatedRequest,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const potentialReturns = await new SportsService().getPotentialReturns(req.query, req.headers)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, potentialReturns.data)
    } catch (err) {
      logger.error(`exposed-api get potential returns error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('challenges/upstake')
  @Security('bearerAuth')
  public async upstakeTokenQty(
    @Request() req: AuthenticatedRequest,
    @Body() requestBody: UpstakeTokenQty,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const upstakeTokenQty = await new SportsService().upstakeTokenQty(req.headers, requestBody)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, upstakeTokenQty.data)
    } catch (err) {
      logger.error(`exposed-api upstake token qty response error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Delete('challenges/{challengeId}/redis')
  @Security('bearerAuth')
  public async removeJoinRedisKey(
    @Request() req: AuthenticatedRequest,
    @Path() challengeId: number,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const upstakeTokenQty = await new SportsService().removeJoinRedisKey(req.headers, challengeId)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, upstakeTokenQty.data)
    } catch (err) {
      logger.error(`exposed-api remove join redis key response error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('leagues')
  @Security('bearerAuth')
  @Tags('Sports')
  public async getLeagues(
    @Request() req: AuthenticatedRequest,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const getLeaguesData = await new SportsService().getLeagues(req.headers)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, getLeaguesData.data)
    } catch (err) {
      logger.error(`exposed-api get leagues data error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }
}
