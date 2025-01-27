/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IKafkaMessage } from '@duelnow/kafka-client'
import { ApiResponse, EVENTS, ErrorType, HttpResponseStatus, TOPICS, apiResponse, errorResponse } from '@duelnow/utils'
import { Body, Controller, Header, Post, Request, Route, Security, Tags } from 'tsoa'

import { UsersService } from '../../service/user'
import { producer } from '../../utils/kafkaProducer'
import { logger } from '../../utils/logger'
import { AuthenticatedRequest, SignInBody, UserSignInParams } from '../../utils/types'

@Route('v1/auth')
export class AuthController extends Controller {
  @Post('sign_in')
  @Security('bearerAuth')
  @Tags('Auth')
  public async signIn(
    @Request() req: AuthenticatedRequest,
    @Body() requestBody: SignInBody,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const jwtPayload = req.user
      const firstName: string | undefined = jwtPayload?.name?.substring(0, jwtPayload?.name?.indexOf(' '))
      const lastName: string | undefined = jwtPayload?.name?.substring(jwtPayload?.name?.indexOf(' ') + 1)
      const userInfo: UserSignInParams = {
        externalUserId: jwtPayload?.verifierId || requestBody.walletAddress,
        walletAddress: requestBody.walletAddress,
        signUpMethod: requestBody.signUpMethod,
        signUpSource: requestBody.signUpSource,
        anonymousId: requestBody.anonymousId,
        nickname: requestBody?.nickname,
        referrerCode: requestBody?.referrerCode,
      }
      if (requestBody?.email) userInfo.email = requestBody?.email?.trim()
      if (firstName) userInfo.firstName = firstName?.trim()
      if (lastName) userInfo.lastName = lastName?.trim()
      if (requestBody?.nickname) userInfo.nickname = requestBody?.nickname?.trim()

      const user = await new UsersService().signIn(userInfo, req.headers)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, user.data)
    } catch (err: any) {
      logger.error(`exposed-api signin error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, err)
    }
  }

  @Post('sign_out')
  @Security('bearerAuth')
  @Tags('Auth')
  public async signOut(
    @Request() req: AuthenticatedRequest,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') authorization: string,
  ): Promise<ApiResponse> {
    try {
      const jwtPayload = req.user
      const secondsLeft = jwtPayload?.exp ? getDifferenceInSeconds(jwtPayload?.exp) : 1
      const token = authorization?.split(' ')?.[1]
      const externalUserId = typeof req?.headers['accountId'] === 'string' ? req?.headers['accountId'] : ''

      const userService = new UsersService()
      await userService.signOut(token, secondsLeft)
      const { data: userDetails } = await userService.getUserByExternalId(externalUserId, req.headers)
      const udid = req.headers['Udid'] || req.headers['udid'] || ''
      const kafkaMessage: IKafkaMessage = {
        key: String(udid),
        value: {
          eventName: EVENTS.AUTH.SIGN_OUT_COMPLETED,
          data: {},
        },
      }
      const kafkaHeaders = { ...req.headers, callerId: userDetails?.userId || externalUserId }
      await producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok)
    } catch (err) {
      logger.error('sign-out error', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }
}

const getDifferenceInSeconds = (timestamp: number): number => {
  // Convert timestamps to Date objects
  const date1 = new Date()
  const date2 = new Date(timestamp * 1000)

  // Get the difference in milliseconds
  const millisecondsDiff = date2.getTime() - date1.getTime()

  // Convert milliseconds to seconds and return
  return millisecondsDiff / 1000
}
