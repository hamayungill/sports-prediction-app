/**
 * In the services we will call proxy APIs
 * For eg: From services we will have to call account-api service to get account related info
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { setRedisKey } from '@duelnow/redis'

import account from '../apis/account'
import { getHeaders } from '../utils/getHeaders'
import { AxiosResponse, UserSignInParams } from '../utils/types'

export class UsersService {
  public async signIn(userInfo: UserSignInParams, headers: object): Promise<AxiosResponse> {
    const { status, data } = await account.post('auth/sign_in', userInfo, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }
  public async signOut(token: string, ttl: number): Promise<string | null> {
    const redisResp = await setRedisKey(`user:jwt:${token}`, JSON.stringify({ signedOut: true }), Math.ceil(ttl))
    return redisResp
  }

  public async getUsers(queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await account.get('users', {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getUserById(userId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await account.get(`users/${userId}`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async updateUserById(userId: string, body: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await account.patch(`users/${userId}`, body, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async resendVerificationCode(userId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await account.get(`users/${userId}/resend_code`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async verifyUserEmail(userId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await account.get(`users/${userId}/verify_email`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async patchTouAndNotif(userId: string, body: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await account.patch(`users/${userId}/tou_notif`, body, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getUserByExternalId(externalUserId: string, headers: object): Promise<AxiosResponse> {
    try {
      const { status, data } = await account.get(`users/extrenalUserId/${externalUserId}`, {
        headers: getHeaders(headers),
      })
      return { status, data }
    } catch (err: any) {
      return { status: err?.errorCode, data: err?.error }
    }
  }

  public async getPreferences(userId: string, headers: object): Promise<AxiosResponse> {
    const { status, data } = await account.get(`users/${userId}/preferences`, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async updateUserPreferences(userId: string, body: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await account.patch(`users/${userId}/preferences`, body, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getReferralStats(userId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await account.get(`users/referrals/stats/${userId}`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }
}
