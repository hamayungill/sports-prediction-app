import { IKafkaMessage } from '@duelnow/kafka-client'
import {
  ApiResponse,
  EVENTS,
  ErrorType,
  HttpResponseStatus,
  Sources,
  TOPICS,
  apiResponse,
  errorResponse,
} from '@duelnow/utils'
import { generateProof } from '@duelnow/web3'
import { Request as ExprsRqst } from 'express'
import { Body, Controller, Post, Request, Route } from 'tsoa'

import { UsersService } from '../service/user'
import { isValidNickname, logger, producer } from '../utils'
import { UserCreationParams } from '../utils/types'

@Route('auth')
export class AuthController extends Controller {
  @Post('sign_in/')
  public async signIn(@Body() requestBody: UserCreationParams, @Request() req: ExprsRqst): Promise<ApiResponse> {
    try {
      const {
        anonymousId,
        email,
        externalUserId,
        firstName,
        lastName,
        referrerCode,
        signUpMethod,
        signUpSource,
        walletAddress,
        nickname,
      } = requestBody

      if (!externalUserId || !walletAddress) {
        this.setStatus(HttpResponseStatus.BadRequest)
        return errorResponse(ErrorType.MissingRequiredField, HttpResponseStatus.BadRequest)
      }
      const userService = new UsersService()
      let userInfo = await userService.getUserByExternalUserId(externalUserId)
      if (requestBody.email) {
        const emailCheckInfo = await userService.getUserByEmail(requestBody.email)
        if (emailCheckInfo && emailCheckInfo.externalUserId !== externalUserId) {
          this.setStatus(HttpResponseStatus.BadRequest)
          return apiResponse(HttpResponseStatus.BadRequest, {
            error: `Account with email "${requestBody.email}" already exists.`,
          })
        }
      }
      if (nickname) {
        const userDetails = await userService.getUserByNickname(nickname)
        if (userDetails && userDetails.externalUserId !== externalUserId) {
          this.setStatus(HttpResponseStatus.BadRequest)
          return apiResponse(HttpResponseStatus.BadRequest, { error: `Nickname is already in use.` })
        }
        if (!isValidNickname(nickname)) {
          this.setStatus(HttpResponseStatus.BadRequest)
          return apiResponse(HttpResponseStatus.BadRequest, {
            error: `Invalid nickname. It should only be alphameric.`,
          })
        }
      }
      const udid = req?.headers['Udid'] || req?.headers['udid'] || ''
      let kafkaHeaders = { ...req.headers, 'caller-id': userInfo?.userId, caller: 'user' }
      if (!userInfo) {
        userInfo = await userService.create({
          email,
          firstName,
          lastName,
          walletAddress,
          externalUserId,
          isEmailVerified: !!requestBody?.email,
          nickname,
          referrerCode,
        })
        kafkaHeaders = { ...kafkaHeaders, 'caller-id': userInfo?.userId }
        const kafkaMessage: IKafkaMessage = {
          key: String(udid),
          value: {
            eventName: EVENTS.AUTH.SIGN_UP_COMPLETED,
            data: {
              email,
              firstName,
              lastName,
              signUpMethod,
              signUpSource: signUpSource || 'organic',
              signUpTime: new Date().toISOString(),
              referrerUserId: userInfo?.referrerUserId || '',
              source: Sources.Users,
              source_id: userInfo?.userId,
            },
          },
        }
        producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)
      }
      const kafkaMessage: IKafkaMessage = {
        key: String(udid),
        value: {
          eventName: EVENTS.AUTH.SIGN_IN_COMPLETED,
          data: {
            email: requestBody?.email,
            source: Sources.Users,
            source_id: userInfo?.userId,
          },
        },
      }
      producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)

      if (anonymousId) {
        const kafkaMsg: IKafkaMessage = {
          key: String(udid),
          value: {
            eventName: EVENTS.TRACKING.USER_IDENTIFIED,
            data: {
              anonymousId,
            },
          },
        }
        producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMsg, kafkaHeaders)
      }
      if (userInfo && userInfo?.walletAddress) {
        const proof = await generateProof(userInfo?.walletAddress)
        userInfo.proof = proof
      }
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, userInfo)
    } catch (err) {
      logger.error(`account-api signin error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }
}
