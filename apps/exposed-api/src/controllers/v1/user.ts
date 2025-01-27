/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import {
  ApiResponse,
  ErrorType,
  HttpResponseStatus,
  PatchUserBody,
  PatchUserTouAndNotif,
  UserPreference,
  apiResponse,
  errorResponse,
} from '@duelnow/utils'
import { Body, Controller, Get, Header, Patch, Path, Query, Request, Route, Security, Tags } from 'tsoa'

import { UsersService } from '../../service/user'
import { logger } from '../../utils/logger'
import { AuthenticatedRequest } from '../../utils/types'

@Route('v1/users')
export class UsersController extends Controller {
  @Get()
  @Security('bearerAuth')
  @Tags('Users')
  public async getUsers(
    @Request() req: AuthenticatedRequest,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const user = await new UsersService().getUsers(req.query, req.headers)
      this.setStatus(HttpResponseStatus.Ok)
      return apiResponse(HttpResponseStatus.Ok, user.data)
    } catch (err) {
      logger.error(`exposed-api getUsers error`, err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    }
  }

  @Get('{userId}')
  @Security('bearerAuth')
  @Tags('Users')
  public async getUserById(
    @Path() userId: string,
    @Request() req: AuthenticatedRequest,
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
  ): Promise<ApiResponse | null> {
    try {
      const user = await new UsersService().getUserById(userId, req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, user.data)
    } catch (err: any) {
      logger.error('getUserById error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, err)
    }
  }

  @Patch('{userId}')
  @Security('bearerAuth')
  @Tags('Users')
  public async patchUser(
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
    @Path() userId: string,
    @Body() patchUserBody: PatchUserBody,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse | null> {
    try {
      const userService = new UsersService()
      const { email, firstName, lastName, nickname, uid, handle } = patchUserBody
      if (!email && !firstName && !lastName && !nickname && !handle) {
        this.setStatus(HttpResponseStatus.BadRequest)
        return apiResponse(HttpResponseStatus.BadRequest, {
          error: 'Either one or all of (email, firstName, lastName, nickname, handle) these should be passed in body.',
        })
      }
      const updateResp = await userService.updateUserById(
        userId,
        { email, firstName, lastName, nickname, uid, handle },
        req.headers,
      )
      return apiResponse(HttpResponseStatus.Ok, updateResp.data)
    } catch (err) {
      logger.error('patchUser error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return apiResponse(HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('{userId}/resend_code')
  @Tags('Users')
  public async resendVerificationCode(
    @Path() userId: string,
    @Request() req: AuthenticatedRequest,
    @Query() uid?: string,
  ): Promise<ApiResponse | null> {
    try {
      const resendResp = await new UsersService().resendVerificationCode(userId, { uid }, req.headers)
      return apiResponse(HttpResponseStatus.Ok, resendResp.data)
    } catch (err) {
      logger.error('resendVerificationCode error', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('{userId}/verify_email')
  @Tags('Users')
  public async verifyUserEmail(
    @Path() userId: string,
    @Query() vc: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse | null> {
    try {
      const verificationResp = await new UsersService().verifyUserEmail(userId, { vc }, req.headers)
      if (verificationResp?.status === 200) {
        return apiResponse(HttpResponseStatus.Ok, verificationResp.data)
      }
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.BadRequest, HttpResponseStatus.BadRequest, { error: `Inavlid / Expired URL` })
    } catch (err) {
      logger.error('getUser error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Patch('{userId}/tou_notif')
  @Security('bearerAuth')
  @Tags('Users')
  public async patchTouAndNotif(
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
    @Path() userId: string,
    @Body() patchUserBody: PatchUserTouAndNotif,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse | null> {
    try {
      const userService = new UsersService()
      const updateResp = await userService.patchTouAndNotif(userId, patchUserBody, req.headers)
      return apiResponse(HttpResponseStatus.Ok, updateResp.data)
    } catch (err) {
      logger.error('patchTouAndNotif error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return apiResponse(HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('{userId}/preferences')
  @Security('bearerAuth')
  @Tags('Users')
  public async getPreferences(
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
    @Path() userId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse | null> {
    try {
      const userService = new UsersService()
      const preferenceResp = await userService.getPreferences(userId, req.headers)
      return apiResponse(HttpResponseStatus.Ok, preferenceResp.data)
    } catch (err) {
      logger.error('getPreferences error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return apiResponse(HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Patch('{userId}/preferences')
  @Security('bearerAuth')
  @Tags('Users')
  public async updateUserPreferences(
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
    @Path() userId: string,
    @Body() patchUserBody: UserPreference[],
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse | null> {
    try {
      const userService = new UsersService()
      const updatePreferenceResp = await userService.updateUserPreferences(userId, patchUserBody, req.headers)
      return apiResponse(HttpResponseStatus.Ok, updatePreferenceResp.data)
    } catch (err) {
      logger.error('updateUserPreferences error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return apiResponse(HttpResponseStatus.BadRequest, { error: err })
    }
  }

  @Get('referrals/stats/{userId}')
  @Security('bearerAuth')
  @Tags('Users')
  public async getReferralStats(
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
    @Path() userId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse | null> {
    try {
      const userService = new UsersService()
      const preferenceResp = await userService.getReferralStats(userId, req.query, req.headers)
      return apiResponse(HttpResponseStatus.Ok, preferenceResp.data)
    } catch (err) {
      logger.error('get referral stats data error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return apiResponse(HttpResponseStatus.BadRequest, { error: err })
    }
  }
}
