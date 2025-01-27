import { IKafkaMessage } from '@duelnow/kafka-client'
import { Paginator, query } from '@duelnow/query-parser'
import { setRedisKey } from '@duelnow/redis'
import {
  ApiResponse,
  CreateChallenge,
  EVENTS,
  ErrorType,
  GetParams,
  HttpResponseStatus,
  JoinChallenge,
  JoinChallengeForm,
  SmartContractResponse,
  Sources,
  TOPICS,
  UpdateChallengeType,
  UpdateTiebreaker,
  UpsertFavorites,
  UpsertLineups,
  UpstakeTokenQty,
  apiResponse,
  errorResponse,
} from '@duelnow/utils'
import { Request as ExprsRqst } from 'express'
import { Body, Controller, Delete, Get, Patch, Path, Post, Request, Route } from 'tsoa'

import { ChallengesService } from '../service/challenges'
import { SportsService } from '../service/sports'
import { logger, producer } from '../utils'

@Route('sports')
export class SportsController extends Controller {
  @Post('challenges')
  public async createChallenge(
    @Body() requestBody: CreateChallenge,
    @Request() req: ExprsRqst,
  ): Promise<ApiResponse | null> {
    try {
      const createChallenge = await new SportsService().createChallenge(requestBody)

      const kafkaHeaders = { ...req.headers, 'caller-id': requestBody.creatorAccountId, caller: 'user' }
      const kafkaMessage: IKafkaMessage = {
        key: requestBody.creatorAccountId,
        value: {
          eventName: EVENTS.BET.CREATED,
          data: {
            challenge: {
              id: createChallenge.challengeId,
              sport: createChallenge.sport.sportName,
              mode: createChallenge.challengeMode,
              type: createChallenge.challengeType,
              category: createChallenge.challengeResults[0]?.category?.categoryApiTitle || '',
              depth: createChallenge?.challengeDepth,
              outcome: createChallenge?.challengeResults[0]?.participantOutcome || '',
            },
            bet: {
              type: createChallenge?.challengeParticipations[0]?.contracts?.tokenName || '',
              amount: Number(createChallenge.challengeValueQty),
              amountInUsd: Number(createChallenge.challengeValueUsd),
              network: createChallenge?.challengeParticipations[0]?.contracts?.networks?.name || '',
            },
            source: Sources.Challenges,
            source_id: createChallenge.challengeId,
          },
        },
      }
      producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, createChallenge)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports-api create challenge error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Post('challenges/{challengeId}')
  public async joinChallenge(
    @Body() requestBody: JoinChallenge,
    @Path() challengeId: number,
    @Request() req: ExprsRqst,
  ): Promise<ApiResponse | null> {
    try {
      const joinChallenge = await new SportsService().joinChallenge(requestBody, challengeId)

      const kafkaHeaders = { ...req.headers, 'caller-id': requestBody.participantAccountId, caller: 'user' }
      const kafkaMessage: IKafkaMessage = {
        key: requestBody.participantAccountId,
        value: {
          eventName: EVENTS.BET.JOINED,
          data: {
            challenge: {
              id: joinChallenge.challengeId,
              sport: joinChallenge.challenges.sport.sportName,
              mode: joinChallenge.challenges.challengeMode,
              type: joinChallenge.challenges.challengeType,
              category: joinChallenge?.challengeResults?.category?.categoryApiTitle || '',
              depth: joinChallenge.challengeDepth,
              outcome: joinChallenge?.challengeResults?.participantOutcome || '',
            },
            bet: {
              type: joinChallenge?.contracts?.tokenName,
              amount: Number(joinChallenge.participationValueQty),
              amountInUsd: Number(joinChallenge.participationValueUsd),
              network: joinChallenge.contracts?.networks?.name,
            },
            source: Sources.Challenges,
            source_id: joinChallenge.challengeId,
          },
        },
      }
      const producerResp = await producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)
      logger.debug(`joinChallenge producerResp`, producerResp)
      logger.debug(`kafkaHeaders`, JSON.stringify(kafkaHeaders))
      logger.debug(`req headers`, JSON.stringify(req.headers))
      return apiResponse(HttpResponseStatus.Ok, joinChallenge)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports-api join challenge error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('lineups')
  public async upsertLineups(@Body() requestBody: UpsertLineups): Promise<ApiResponse | null> {
    try {
      const upsertLineups = await new SportsService().upsertLineups(requestBody)
      return apiResponse(HttpResponseStatus.Ok, upsertLineups)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports-api upsert lineups error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get()
  public async getSports(@Request() req: ExprsRqst): Promise<ApiResponse | null> {
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
      const { data, count } = await new SportsService().getSports(params)
      const nextCursor = pagination.getNextCursor(count)

      return apiResponse(HttpResponseStatus.Ok, { sports: data, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports-api getSports error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('default-odds')
  public async getDefaultOdds(@Request() req: ExprsRqst): Promise<ApiResponse | null> {
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
      const { data, count } = await new SportsService().getDefaultOdds(params)
      const nextCursor = pagination.getNextCursor(count)

      return apiResponse(HttpResponseStatus.Ok, { sports: data, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports-api get default odds error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Post('join-challenge-form')
  public async joinChallengeForm(@Body() requestBody: JoinChallengeForm): Promise<ApiResponse | null> {
    try {
      const networkId = await new ChallengesService().getNetworkByContract(requestBody)
      await setRedisKey(
        `challenge:${requestBody.scChallengeId}:join:${requestBody.walletAddress}:network:${networkId}:form`,
        JSON.stringify(requestBody),
        3600,
      )

      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, requestBody)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports - api create join challenge form error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('tiebreaker')
  public async updateTiebreaker(@Body() requestBody: UpdateTiebreaker): Promise<ApiResponse | null> {
    try {
      const updateTiebreaker = await new SportsService().updateTiebreaker(requestBody)
      return apiResponse(HttpResponseStatus.Ok, updateTiebreaker)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports - api update tiebreaker error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('challenges/type')
  public async updateChallengeType(@Body() requestBody: UpdateChallengeType): Promise<ApiResponse | null> {
    try {
      const updateChallengeType = await new SportsService().updateChallengeType(requestBody)
      return apiResponse(HttpResponseStatus.Ok, updateChallengeType)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports - api update challenge type error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('challenges/smartcontract')
  public async smartContractResponse(@Body() requestBody: SmartContractResponse): Promise<ApiResponse | null> {
    try {
      const smartContractResponse = await new SportsService().smartContractResponse(requestBody)
      return apiResponse(HttpResponseStatus.Ok, smartContractResponse)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports - api smart contract response error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('challenges/cancel/{challengeId}')
  public async cancelChallenge(@Path() challengeId: number, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const cancelChallenge = await new SportsService().cancelChallenge(challengeId)
      const cancelData = cancelChallenge[1]
      if (cancelData) {
        for (const eachCnclData of cancelData.challengeParticipations) {
          const participantAccountId = eachCnclData?.walletAddress?.userId
          const kafkaHeaders = { ...req.headers, 'caller-id': participantAccountId, caller: 'user' }
          const kafkaMessage: IKafkaMessage = {
            key: participantAccountId,
            value: {
              eventName: EVENTS.BET.CANCELLED,
              data: {
                challenge: {
                  id: cancelData.challengeId,
                  sport: cancelData.sport.sportName,
                  mode: cancelData.challengeMode,
                  type: cancelData.challengeType,
                  category: eachCnclData?.challengeResults?.category?.categoryApiTitle || '',
                  depth: eachCnclData.challengeDepth,
                  outcome: eachCnclData?.challengeResults?.participantOutcome || '',
                  reasonCode: cancelData.reasonCode,
                },
                bet: {
                  type: eachCnclData?.contracts?.tokenName,
                  amount: Number(eachCnclData.participationValueQty),
                  amountInUsd: Number(eachCnclData.participationValueUsd),
                  network: eachCnclData?.contracts?.networks?.name,
                },
                source: Sources.Challenges,
                source_id: cancelData.challengeId,
              },
            },
          }
          producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)
        }
      }
      return apiResponse(HttpResponseStatus.Ok, cancelChallenge)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports - api cancel challenge response error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('challenges/favorites')
  public async getFavorites(@Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      let userId = req.headers['caller-id']
      userId = typeof userId === 'string' ? userId : ''
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
      const { data, count } = await new SportsService().getFavorites(userId, params)
      const nextCursor = await pagination.getNextCursor(count)
      return apiResponse(HttpResponseStatus.Ok, { favorites: data, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      logger.error(`sports - api get favorites response error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Patch('challenges/favorites')
  public async updateFavorites(
    @Request() req: ExprsRqst,
    @Body() requestBody: UpsertFavorites,
  ): Promise<ApiResponse | null> {
    try {
      const updateFavorites = await new SportsService().updateFavorites(req.headers, requestBody)
      return apiResponse(HttpResponseStatus.Ok, updateFavorites)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports - api update favorites response error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('potential-returns')
  public async getPotentialReturns(@Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const queries = req.query
      const filter = query.getDbQuery(queries)
      const params: GetParams = {}
      if (filter) params.filter = filter
      const potentialReturns = await new SportsService().getPotentialReturns(params)

      return apiResponse(HttpResponseStatus.Ok, { returns: potentialReturns })
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports - api get potential returns error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('challenges/upstake')
  public async upstakeTokenQty(
    @Request() req: ExprsRqst,
    @Body() requestBody: UpstakeTokenQty,
  ): Promise<ApiResponse | null> {
    try {
      const upstakeTokenQty = await new SportsService().upstakeTokenQty(requestBody)
      return apiResponse(HttpResponseStatus.Ok, upstakeTokenQty)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports-api upstake token qty response error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Delete('challenges/{challengeId}/redis')
  public async removeJoinRedisKey(@Path() challengeId: number): Promise<ApiResponse | null> {
    try {
      await new SportsService().removeJoinRedisKey(challengeId)
      return apiResponse(HttpResponseStatus.Ok)
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports-api remove join redis key response error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('leagues')
  public async getLeagues(): Promise<ApiResponse | null> {
    try {
      const getLeaguesData = await new SportsService().getLeagues()
      return apiResponse(HttpResponseStatus.Ok, { leagues: getLeaguesData })
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`sports-api get leagues data response error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }
}
