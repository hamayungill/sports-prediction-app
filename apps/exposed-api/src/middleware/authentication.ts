/* eslint-disable  @typescript-eslint/no-explicit-any */
import { getRedisKey, setRedisKey } from '@duelnow/redis'
import { ErrorType, HttpResponseStatus, errorResponse, isLocal } from '@duelnow/utils'
import { Request } from 'express'
import * as jose from 'jose'

import { UsersService } from '../service/user'
import { AuthType, JWKS_URLS } from '../utils/const'

interface JWKSResolver {
  (
    protectedHeader?: jose.JWSHeaderParameters | undefined,
    token?: jose.FlattenedJWSInput | undefined,
  ): Promise<jose.KeyLike>
}

export const expressAuthentication = async (
  request: Request,
  securityName: string, // sticking to tsoa convention
  scopes?: string[],
): Promise<any> => {
  const token = request.headers['authorization']
  const appPubKey = request.headers['apppubkey']
  const authorizationType = request.headers['authorizationtype']
  if (securityName !== 'bearerAuth' || !token || !appPubKey || !authorizationType) {
    throw errorResponse(ErrorType.InvalidHeaders, HttpResponseStatus.Unauthorized)
  }
  try {
    const idToken = token?.split(' ')[1]
    const signedOutToken = await getRedisKey(`user:jwt:${idToken}`)
    // Checking the user signed out or not
    if (signedOutToken) {
      throw errorResponse(ErrorType.InvalidToken, HttpResponseStatus.Unauthorized)
    }
    let jwks!: JWKSResolver
    switch (authorizationType) {
      case AuthType.Email:
      case AuthType.Social:
        jwks = jose.createRemoteJWKSet(new URL(JWKS_URLS.SOCIAL))
        break
      case AuthType.Wallet:
        jwks = jose.createRemoteJWKSet(new URL(JWKS_URLS.CUSTOM_WALLET))
        break
    }

    // Web3Auth Docs  https://web3auth.io/docs/pnp/features/server-side-verification/social-login-users#verifying-idtoken-in-backend
    const jwtDecoded: any = await jose.jwtVerify(idToken as string, jwks, {
      algorithms: ['ES256'],
    })
    if (
      typeof appPubKey === 'string' &&
      (jwtDecoded?.payload?.wallets[0]?.public_key?.toLowerCase() === appPubKey?.toLowerCase() || // social/email login
        jwtDecoded?.payload?.wallets[0]?.address?.toLowerCase() === appPubKey?.toLowerCase()) // wallet login
    ) {
      let externalUserId = ''
      // Assigning externalUserId to headers to track in logs of logz
      if (authorizationType !== AuthType.Wallet) {
        externalUserId = jwtDecoded.payload?.verifierId
      } else {
        externalUserId = typeof appPubKey === 'string' ? appPubKey : ''
      }
      request.headers['accountId'] = externalUserId

      if (isLocal()) return jwtDecoded.payload

      // Validating User if the route is not sign_in
      if (!request.path?.toLowerCase().includes('sign_in')) {
        const userDataRedisKey = `user:account:${externalUserId}`
        let data: any
        let status: number
        const redisUserData = await getRedisKey(userDataRedisKey)
        if (redisUserData) {
          const parsedData = JSON.parse(redisUserData)
          data = parsedData?.data
          status = parsedData?.status
        } else {
          const userResponse = await new UsersService().getUserByExternalId(externalUserId, request.headers)
          data = userResponse?.data
          status = userResponse?.status
        }
        if (status >= 200 && status < 300) {
          const pathUserId = request.params.userId || request.params.userid
          if (pathUserId && pathUserId !== data?.userId) {
            throw errorResponse(ErrorType.BadRequest, HttpResponseStatus.BadRequest, {
              error: `Accessing other users' data is prohibited.`,
            })
          }
          if (data?.accountStatus?.toLowerCase() !== 'active') {
            throw errorResponse(ErrorType.BadRequest, HttpResponseStatus.BadRequest, { error: `Account is blocked` })
          }
          if (!redisUserData) {
            // Caching user data for 24 hours
            setRedisKey(userDataRedisKey, JSON.stringify({ data, status }), 24 * 60 * 60)
          }
        } else {
          throw errorResponse(ErrorType.InvalidToken, HttpResponseStatus.Unauthorized, {
            error: `User account not found.`,
          })
        }
      }
      if (scopes && scopes.length) {
        // TODO: Implement Authorization/RBAC logic here
      }
      return jwtDecoded.payload
    } else {
      // Verification failed
      throw errorResponse(ErrorType.InvalidToken, HttpResponseStatus.Unauthorized)
    }
  } catch (err: any) {
    if (!(err instanceof Error)) throw err
    throw errorResponse(ErrorType.InvalidJWS, HttpResponseStatus.Unauthorized, { stack: err.stack })
  }
}
