/* eslint-disable @typescript-eslint/no-explicit-any */
import { IKafkaMessage } from '@duelnow/kafka-client'
import { Paginator, query } from '@duelnow/query-parser'
import { getRedisKey, setRedisKey } from '@duelnow/redis'
import {
  ApiResponse,
  EVENTS,
  ErrorType,
  GetParams,
  HttpResponseStatus,
  PatchUserBody,
  PatchUserTouAndNotif,
  TOPICS,
  UserPreference,
  apiResponse,
  errorResponse,
  generateCode,
} from '@duelnow/utils'
import { Request as ExprsRqst } from 'express'
import { Body, Controller, Get, Patch, Path, Query, Request, Route } from 'tsoa'

import { UsersService } from '../service/user'
import { EMAIL_VERIFY_BASE_URL, EMAIL_VERIFY_CODE_CACHE_TTL, isValidNickname, logger, producer } from '../utils'
import { updateFirebaseUserEmail } from '../utils/firebase'

@Route('users')
export class UsersController extends Controller {
  @Get('')
  public async getUsers(@Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const queries = req.query
      const filter = query.getDbQuery(queries)
      const sort = typeof queries?.sort === 'string' ? query.getDbQuerySort({ sort: queries.sort }) : null
      const getUserParams: GetParams = {}
      if (filter) getUserParams.filter = filter
      if (sort) getUserParams.sort = sort

      const cursor = typeof queries?.cursor === 'string' ? queries?.cursor : undefined
      const limit = typeof queries?.limit === 'string' ? queries?.limit : '25'
      const pagination = new Paginator({ cursor, limit: limit })

      getUserParams.take = parseInt(limit)
      getUserParams.skip = pagination.decoded.skip

      const { users, count } = await new UsersService().getUsers(getUserParams)
      const nextCursor = pagination.getNextCursor(count)
      return apiResponse(HttpResponseStatus.Ok, { users, pagination: { count, cursor, nextCursor } })
    } catch (err) {
      logger.error('getUsers error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{userId}')
  public async getUser(@Path() userId: string, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const queries = req.query
      const fields =
        typeof queries?.fields === 'string' ? query.getDbQuerySelect({ fields: queries.fields }) : undefined
      const user = await new UsersService().getUserByID(userId, fields)
      if (user) {
        const redisKey = `user:email:verify:${userId}`
        const emailVcCache = await getRedisKey(redisKey)
        if (emailVcCache) {
          const parsedCache = JSON.parse(emailVcCache)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: TS data type check ignore for adding new field
          user['unverifiedEmail'] = parsedCache.email
        }
        return apiResponse(HttpResponseStatus.Ok, user)
      }
      this.setStatus(HttpResponseStatus.BadRequest)
      return apiResponse(HttpResponseStatus.NotFound, { error: `User with userId ${userId} not found` })
    } catch (err) {
      logger.error('getUser error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('{userId}')
  public async patchUser(
    @Path() userId: string,
    @Body() patchUserBody: PatchUserBody,
    @Request() req: ExprsRqst,
  ): Promise<ApiResponse | null> {
    try {
      const userService = new UsersService()
      const user = await userService.getUserByID(userId)
      const udid = req.headers['Udid'] || req.headers['udid'] || ''
      if (!user) {
        this.setStatus(HttpResponseStatus.BadRequest)
        return apiResponse(HttpResponseStatus.NotFound, { error: `User with userId ${userId} not found` })
      }
      const { email, firstName, lastName, nickname, uid, handle } = patchUserBody
      const userData: Record<string, string | boolean> = {}
      let message: string = ''
      if (firstName) {
        userData.firstName = firstName
        message += `firstName, `
      }
      if (lastName) {
        userData.lastName = lastName
        message += `lastName, `
      }
      if (nickname) {
        const userDetails = await userService.getUserByNickname(nickname)
        if (userDetails) {
          this.setStatus(HttpResponseStatus.BadRequest)
          return apiResponse(HttpResponseStatus.BadRequest, { error: `Nickname is already in use.` })
        }
        if (!isValidNickname(nickname)) {
          this.setStatus(HttpResponseStatus.BadRequest)
          return apiResponse(HttpResponseStatus.BadRequest, {
            error: `Invalid nickname. It should only be alphameric.`,
          })
        }
        userData.nickname = nickname
        message += `nickname, `
      }

      if (handle) {
        const handleDetails = await userService.getUserByHandle(handle)
        if (handleDetails) {
          this.setStatus(HttpResponseStatus.BadRequest)
          return apiResponse(HttpResponseStatus.BadRequest, { error: `Handle is already in use.` })
        }
        if (!isValidNickname(handle)) {
          this.setStatus(HttpResponseStatus.BadRequest)
          return apiResponse(HttpResponseStatus.BadRequest, {
            error: `Invalid handle. It should only be alphameric.`,
          })
        }
        userData.handle = handle
        message += `handle, `
      }

      const emailVerificationCode = generateCode(6)
      const kafkaHeaders = { ...req.headers, 'caller-id': userId, caller: 'user' }
      if (email) {
        const emailCheckInfo = await userService.getUserByEmail(email)
        if (emailCheckInfo) {
          this.setStatus(HttpResponseStatus.BadRequest)
          return apiResponse(HttpResponseStatus.BadRequest, { error: `Account with email "${email}" already exists.` })
        }
        const redisKey = `user:email:verify:${userId}`
        const setRedisRes = await setRedisKey(
          redisKey,
          JSON.stringify({ vc: emailVerificationCode, email: patchUserBody.email, uid }),
          parseInt(EMAIL_VERIFY_CODE_CACHE_TTL),
        )
        logger.debug('Profile patch email redis response', setRedisRes)
        const emailVerificationURL = `${EMAIL_VERIFY_BASE_URL}?uid=${userId}&vc=${emailVerificationCode}`
        logger.debug('Profile patch verificationUrl', emailVerificationURL)

        const kafkaMessage: IKafkaMessage = {
          key: String(udid),
          value: {
            eventName: EVENTS.TRACKING.EMAIL_VERIFICATION_SENT,
            data: {
              newEmail: email,
              emailVerificationLink: emailVerificationURL,
            },
          },
        }
        producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)

        message = message
          ? `${message} updated and Email verification link is sent to your new email.`
          : `Email verification link is sent to your new email.`
      } else {
        message += 'updated!'
      }
      if (Object.keys(userData).length) {
        const kfkaMessage: IKafkaMessage = {
          key: String(udid),
          value: {
            eventName: EVENTS.TRACKING.PROFILE_UPDATED,
            data: userData,
          },
        }
        producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kfkaMessage, kafkaHeaders)
        await userService.updateUserById(userId, userData)
      }
      return apiResponse(HttpResponseStatus.Ok, {
        message,
      })
    } catch (err) {
      logger.error('patchUser error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{userId}/resend_code')
  public async resendVerificationCode(
    @Path() userId: string,
    @Request() req: ExprsRqst,
    @Query() uid?: string,
  ): Promise<ApiResponse | null> {
    try {
      const userService = new UsersService()
      const user = await userService.getUserByID(userId)
      if (!user) {
        this.setStatus(HttpResponseStatus.BadRequest)
        return apiResponse(HttpResponseStatus.BadRequest, { error: `User with userId ${userId} not found` })
      }
      const redisKey = `user:email:verify:${userId}`
      logger.debug('Fetching email vs cache for key', redisKey)
      const emailVcCache = await getRedisKey(redisKey)

      if (!emailVcCache) {
        logger.warn('No email vs cache found for', redisKey)
        this.setStatus(HttpResponseStatus.BadRequest)
        return apiResponse(HttpResponseStatus.BadRequest, {
          error: `Verification has timed out, please verify again from your settings.`,
        })
      }

      interface EmailVsCache {
        vc: string
        email: string
        uid: string
      }

      const parsedCache = JSON.parse(emailVcCache)
      logger.debug('Resend email cache parsed', parsedCache)
      const emailVerificationCode = generateCode(6)

      const newCache: EmailVsCache = {
        vc: emailVerificationCode,
        email: parsedCache?.email,
        uid: uid || parsedCache?.uid,
      }
      logger.debug('New cache', newCache)

      await setRedisKey(redisKey, JSON.stringify(newCache), parseInt(EMAIL_VERIFY_CODE_CACHE_TTL))
      const emailVerificationURL = `${EMAIL_VERIFY_BASE_URL}?uid=${userId}&vc=${emailVerificationCode}`
      logger.debug('Resend verificationUrl', emailVerificationURL)

      const correlationId = req.headers['correlation-id'] || req.headers['Correlation-Id'] || ''
      const kafkaMessage: IKafkaMessage = {
        key: String(correlationId),
        value: {
          eventName: EVENTS.TRACKING.EMAIL_VERIFICATION_SENT,
          data: {
            newEmail: newCache.email,
            emailVerificationLink: emailVerificationURL,
          },
        },
      }
      const kafkaHeaders = { ...req.headers, callerId: userId }
      await producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, { message: `Email verification link is sent to your registered email` })
    } catch (err) {
      logger.error('resendVerificationCode error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{userId}/verify_email')
  public async verifyUserEmail(
    @Path() userId: string,
    @Query() vc: string,
    @Request() req: ExprsRqst,
  ): Promise<ApiResponse | null> {
    try {
      const userService = new UsersService()
      const user = await userService.getUserByID(userId)
      if (!user) {
        this.setStatus(HttpResponseStatus.BadRequest)
        return apiResponse(HttpResponseStatus.BadRequest, { error: `User with userId ${userId} not found` })
      }
      const redisKey = `user:email:verify:${userId}`
      const emailVcCache = await getRedisKey(redisKey)
      if (emailVcCache) {
        const parsedCache = JSON.parse(emailVcCache)
        if (parsedCache?.vc === vc) {
          await userService.updateUserById(userId, {
            email: parsedCache?.email,
            isEmailVerified: true,
          })

          const udid = req.headers['Udid'] || req.headers['udid'] || ''
          const kafkaMessage: IKafkaMessage = {
            key: String(udid),
            value: {
              eventName: EVENTS.TRACKING.PROFILE_UPDATED,
              data: {
                oldEmail: user.email,
                newEmail: parsedCache?.email,
                emailVerified: true,
              },
            },
          }
          const kafkaHeaders = { ...req.headers, callerId: userId, caller: 'user' }
          logger.debug('verify_email userId is', userId)
          logger.debug('verify_email kafka headers', kafkaHeaders)
          logger.debug('verify_email kafka message', kafkaMessage)
          producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)

          if (parsedCache?.uid) {
            await updateFirebaseUserEmail(parsedCache.uid, { email: parsedCache?.email, emailVerified: true })
          }

          await setRedisKey(redisKey, '', 0)
          this.setStatus(HttpResponseStatus.Ok)
          return apiResponse(HttpResponseStatus.Ok, { message: `Email verified successfully!` })
        }
      }
      this.setStatus(HttpResponseStatus.BadRequest)
      return apiResponse(HttpResponseStatus.BadRequest, { error: `Invalid / Expired URL` })
    } catch (err) {
      logger.error('verifyUserEmail error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Patch('{userId}/tou_notif')
  public async patchTouAndNotif(
    @Path() userId: string,
    @Body() patchUserBody: PatchUserTouAndNotif,
    @Request() req: ExprsRqst,
  ): Promise<ApiResponse | null> {
    try {
      const userService = new UsersService()
      const user: Record<string, any> | null = await userService.getUserByID(userId)
      if (!user) {
        this.setStatus(HttpResponseStatus.BadRequest)
        return apiResponse(HttpResponseStatus.NotFound, { error: `User with userId ${userId} not found` })
      }
      const { terms } = patchUserBody
      if (!terms) {
        this.setStatus(HttpResponseStatus.BadRequest)
        return errorResponse(ErrorType.MissingRequiredField, HttpResponseStatus.BadRequest, {
          error: 'terms should be sent in the body',
        })
      }
      const userData: PatchUserTouAndNotif = {}
      if (terms) {
        const oldTerms = user.meta?.terms ? user.meta?.terms : {}
        userData.terms = { ...oldTerms, ...terms }
      }

      let meta: Record<string, any> = {}
      if (typeof user.meta === 'object') {
        meta = { ...user?.meta, ...userData }
      } else {
        meta = { ...userData }
      }

      const udid = req.headers['Udid'] || req.headers['udid'] || ''
      const kafkaMessage: IKafkaMessage = {
        key: String(udid),
        value: {
          eventName: EVENTS.TRACKING.PROFILE_UPDATED,
          data: { meta },
        },
      }
      const kafkaHeaders = { ...req.headers, callerId: userId, caller: 'user' }
      producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)
      const updateResp = await userService.updateUserById(userId, { meta })
      return apiResponse(HttpResponseStatus.Ok, { user: updateResp })
    } catch (err) {
      logger.error('patchTouAndNotif error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('extrenalUserId/{externalUserId}')
  public async getUserByExternelUserId(@Path() externalUserId: string): Promise<ApiResponse | null> {
    try {
      const user = await new UsersService().getUserByExternalUserId(externalUserId)
      if (user) return apiResponse(HttpResponseStatus.Ok, user)
      this.setStatus(HttpResponseStatus.BadRequest)
      return apiResponse(HttpResponseStatus.NotFound, { error: `User with extrenalUserId ${externalUserId} not found` })
    } catch (err) {
      logger.error('getUserByExternelUserId error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{userId}/preferences')
  public async getPreferences(@Path() userId: string): Promise<ApiResponse | null> {
    try {
      const preferences = await new UsersService().getPreferences(userId)
      return apiResponse(HttpResponseStatus.Ok, preferences)
    } catch (err) {
      logger.error('fetchPreferences error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Patch('{userId}/preferences')
  public async updateUserPreferences(
    @Path() userId: string,
    @Body() patchUserBody: UserPreference[],
  ): Promise<ApiResponse | null> {
    try {
      const preferences = patchUserBody
      const userPreferencesData = await new UsersService().updateUserPreference(userId, preferences)
      if (userPreferencesData) return apiResponse(HttpResponseStatus.Ok, userPreferencesData)
      this.setStatus(HttpResponseStatus.BadRequest)
      return apiResponse(HttpResponseStatus.BadRequest, { error: `User preference update failed!` })
    } catch (err) {
      logger.error('updateUserPreference error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  // referral stats
  @Get('referrals/stats/{userId}')
  public async referralStats(@Path() userId: string, @Request() req: ExprsRqst): Promise<ApiResponse | null> {
    try {
      const getReferralStatsData = await new UsersService().getReferralStats(userId, req.query?.filter)
      return apiResponse(HttpResponseStatus.Ok, { ...getReferralStatsData })
    } catch (err) {
      this.setStatus(HttpResponseStatus.BadRequest)
      logger.error(`account-api get referral stats data response error`, err)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }
}
