import { Prisma } from '@duelnow/database'
import { ErrorType, HttpResponseStatus, TOPICS, apiResponse, errorResponse } from '@duelnow/utils'
import { Request as ExprsRqst } from 'express'
import { mock, mockReset } from 'jest-mock-extended'

import { AuthController } from './auth'
import { logger, producer } from '../utils'

// Correctly typing the mock\
const mockRequest = mock<ExprsRqst>()

const userObject = {
  userId: '5cc785fc-da02-40fc-869e-a1c707c8a70b',
  externalUserId: '0xa387e8F358cC74AB2d84C10B1dCF91f033c4d8D1',
  email: 'test@example.com',
  walletAddress: '0xa392e8F358cC74AB2d84C10B1dCF91f033c4d8D1',
  firstName: null,
  lastName: null,
  nickname: 'YieldingBeeScarlet',
  accountStatus: Prisma.Status.Active,
  createdAt: new Date('2024-06-20T07:34:26.052Z'),
  updatedAt: new Date('2024-06-20T07:43:57.234Z'),
  isEmailVerified: true,
  meta: {
    terms: {
      v1_0_0: true,
    },
  },
  handle: 'LRF1OL',
  referralCode: 'LRF1OL',
  referrerUserId: null,
}

// Mock dependencies
jest.mock('../service/user', () => ({
  UsersService: jest.fn().mockImplementation(() => ({
    getUserByEmail: jest.fn((email) => (email === userObject.email ? userObject : null)),
    getUserByExternalUserId: jest.fn((id) => {
      if (id === userObject.externalUserId) return userObject
      else if (id === 'user123') throw new Error('Some error')
      else return null
    }),
    getUserByNickname: jest.fn((nickName) => (nickName === userObject.nickname ? userObject : null)),
    create: jest.fn((uo) => (uo.email === 'email@test.com' ? userObject : null)),
  })),
}))
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  producer: {
    sendMessage: jest.fn(),
  },
}))

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))
jest.mock('@duelnow/logger')
jest.mock('../utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  expressLogger: jest.fn(),
}))
jest.mock('@duelnow/utils', () => ({
  ...jest.requireActual('@duelnow/utils'),
  apiResponse: jest.fn(),
  errorResponse: jest.fn(),
}))

jest.mock('@duelnow/web3', () => ({
  ...jest.requireActual('@duelnow/web3'),
  generateProof: jest.fn().mockReturnValue(['ABC123']),
}))

beforeEach(() => {
  mockReset(mockRequest)
  jest.clearAllMocks()
})

describe('AuthController', () => {
  describe('signIn', () => {
    const authController = new AuthController()

    it('should return an error if externalUserId or walletAddress is missing', async () => {
      const requestBody = { externalUserId: '', walletAddress: '' }
      mockRequest.headers = {}

      await authController.signIn(requestBody, mockRequest)

      expect(errorResponse).toHaveBeenCalledWith(ErrorType.MissingRequiredField, HttpResponseStatus.BadRequest)
    })

    it('should return an error if email is already taken by another user', async () => {
      const requestBody = {
        email: userObject.email,
        externalUserId: 'external-user-id',
        walletAddress: userObject.walletAddress,
      }
      mockRequest.headers = {}

      await authController.signIn(requestBody, mockRequest)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, {
        error: `Account with email "test@example.com" already exists.`,
      })
    })

    it('should return an error if nickname is already in use by another user', async () => {
      const requestBody = {
        nickname: userObject.nickname,
        externalUserId: 'test-external-user-id',
        walletAddress: userObject.walletAddress,
      }
      mockRequest.headers = {}

      await authController.signIn(requestBody, mockRequest)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, {
        error: `Nickname is already in use.`,
      })
    })

    it('should create a new user and send a sign-up completed event if user does not exist', async () => {
      const requestBody = {
        externalUserId: 'test-external-user-id',
        walletAddress: 'wallet-address',
        email: 'email@test.com',
      }
      mockRequest.headers = { udid: 'device123' }

      await authController.signIn(requestBody, mockRequest)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, userObject)
      expect(producer.sendMessage).toHaveBeenCalledWith(
        TOPICS.TRACKING.USER.EVENTS,
        expect.any(Object),
        expect.any(Object),
      )
      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, expect.any(Object))
    })

    it('should return an error if invalid nickname is used', async () => {
      const requestBody = {
        externalUserId: 'external1-user-id',
        walletAddress: 'wallet-address',
        email: 'email@test1.com',
        nickname: 'nickname-12*',
      }
      mockRequest.headers = { udid: 'dasjfduysj267ew76' }

      await authController.signIn(requestBody, mockRequest)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, {
        error: `Invalid nickname. It should only be alphameric.`,
      })
    })

    it('should log an error and return a bad request response if an exception is thrown', async () => {
      const requestBody = { externalUserId: 'user123', walletAddress: 'wallet123' }
      mockRequest.headers = {}

      await authController.signIn(requestBody, mockRequest)

      expect(logger.error).toHaveBeenCalledWith(`account-api signin error`, expect.any(Error))
      expect(errorResponse).toHaveBeenCalledWith(ErrorType.CatchError, HttpResponseStatus.BadRequest)
    })

    it('should send anonymousId details to Kafka', async () => {
      const requestBody = {
        externalUserId: 'test-external-user-id',
        walletAddress: 'wallet-address',
        email: 'test@email.com',
        anonymousId: 'abvcderffvhb132',
      }
      mockRequest.headers = { udid: 'device123' }

      await authController.signIn(requestBody, mockRequest)

      expect(apiResponse).toHaveBeenCalled()
      expect(producer.sendMessage).toHaveBeenCalledWith(
        TOPICS.TRACKING.USER.EVENTS,
        expect.any(Object),
        expect.any(Object),
      )
    })
  })
})
