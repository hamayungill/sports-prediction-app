/* eslint-disable  @typescript-eslint/no-explicit-any */
import { Request } from 'express'
import * as jose from 'jose'
import { createRequest } from 'node-mocks-http'

import { expressAuthentication } from './authentication'

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('../service/user', () => {
  return {
    UsersService: jest.fn().mockImplementation(() => ({
      getUserByExternalId: (): object => ({ status: 404, data: {} }),
    })),
  }
})

jest.mock('jose', () => {
  return {
    createRemoteJWKSet: jest.fn(),
    jwtVerify: jest.fn((...params: any): any => {
      return new Promise((resolve) => {
        resolve({
          payload: {
            wallets: [
              {
                public_key: params[0],
              },
            ],
          },
        })
      })
    }),
  }
})
jest.mock('@duelnow/redis', (): object => ({
  getRedisKey: jest.fn(),
}))

const authorization = 'Bearer 3be3c89f-c8f6-4f66-99cc-a5401cdb26a6'
const apppubkey = '3be3c89f-c8f6-4f66-99cc-a5401cdb26a6'

describe('expressAuthentication test', () => {
  const validReqst: Request = createRequest({
    method: 'GET',
    url: '/sign_in',
    headers: {},
  })
  const decodedTokenData = {
    wallets: [
      {
        public_key: apppubkey,
      },
    ],
  }

  describe('when headers are provided', () => {
    beforeEach(() => {
      validReqst.headers = { authorization, apppubkey }
    })

    it('should return decoded payload for request without scope and authorizationtype wallet', async () => {
      validReqst.headers = { authorizationtype: 'wallet', ...validReqst.headers }
      const data = await expressAuthentication(validReqst, 'bearerAuth')
      expect(data).toStrictEqual(decodedTokenData)
    })

    it('should return decoded payload for request without scope and authorizationtype social', async () => {
      validReqst.headers = { authorizationtype: 'social', ...validReqst.headers }
      const data = await expressAuthentication(validReqst, 'bearerAuth')
      expect(data).toStrictEqual(decodedTokenData)
    })

    it('should return decoded payload for request without scope and authorizationtype email', async () => {
      validReqst.headers = { authorizationtype: 'email', ...validReqst.headers }
      const data = await expressAuthentication(validReqst, 'bearerAuth')
      expect(data).toStrictEqual(decodedTokenData)
    })

    // TODO: Update the test case when RBAC is introduced
    it('should return decoded payload for request with scope', async () => {
      validReqst.headers = { authorizationtype: 'social', ...validReqst.headers }
      const data = await expressAuthentication(validReqst, 'bearerAuth', ['admin'])
      expect(data).toStrictEqual(decodedTokenData)
    })
  })

  describe('when headers are not provided', () => {
    const invalidReqst: Request = createRequest({
      method: 'GET',
      url: '/',
    })
    it('should throw error on invalid authorizationType', async () => {
      try {
        await expressAuthentication(invalidReqst, 'test')
      } catch (err: any) {
        expect(err.resData).toEqual({
          code: 'E1001',
          status: 'error',
          message: 'Invalid auth info, missing required headers',
        })
      }
    })

    it('should throw error in absence of authorization header', async () => {
      try {
        await expressAuthentication(invalidReqst, 'bearerAuth')
      } catch (err: any) {
        expect(err.resData).toEqual({
          code: 'E1001',
          status: 'error',
          message: 'Invalid auth info, missing required headers',
        })
      }
    })

    it('should throw error in absence of apppubkey header', async () => {
      invalidReqst.headers = {
        authorization,
      }
      try {
        await expressAuthentication(invalidReqst, 'bearerAuth')
      } catch (err: any) {
        expect(err.resData).toEqual({
          code: 'E1001',
          status: 'error',
          message: 'Invalid auth info, missing required headers',
        })
      }
    })

    it('should throw error in absence of authorizationtype header', async () => {
      invalidReqst.headers = {
        authorization,
        apppubkey,
      }
      try {
        await expressAuthentication(invalidReqst, 'bearerAuth')
      } catch (err: any) {
        expect(err.resData).toEqual({
          code: 'E1001',
          status: 'error',
          message: 'Invalid auth info, missing required headers',
        })
      }
    })

    it('should throw error on invalid apppubkey header', async () => {
      invalidReqst.headers = {
        authorization,
        apppubkey: '3be3c89f-c8f6-4f66-99cc-a5401cdb26',
        authorizationtype: 'social',
      }
      try {
        await expressAuthentication(invalidReqst, 'bearerAuth')
      } catch (err: any) {
        expect(err.resData).toEqual({
          code: 'E1002',
          status: 'error',
          message: 'Invalid auth token!',
        })
      }
    })

    it('should throw error on jwtVerify function call', async () => {
      invalidReqst.headers = {
        authorization,
        apppubkey: '3be3c89f-c8f6-4f66-99cc-a5401cdb26',
        authorizationtype: 'social',
      }

      jest.spyOn(jose, 'jwtVerify').mockRejectedValue(new Error('Invalid JWS'))
      try {
        await expressAuthentication(invalidReqst, 'bearerAuth')
      } catch (err: any) {
        expect(err.resData.message).toBe('Invalid JWS')
      }
    })
  })
})
