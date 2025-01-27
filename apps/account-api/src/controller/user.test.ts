import { Prisma } from '@duelnow/database'
import * as redis from '@duelnow/redis'
import { ErrorType, HttpResponseStatus, apiResponse, errorResponse } from '@duelnow/utils'
import { Request } from 'express'

import { UsersController } from './user'
import { UsersService } from '../service/user'
import { producer } from '../utils'
import { updateFirebaseUserEmail } from '../utils/firebase'

jest.mock('../service/user')
jest.mock('@duelnow/redis')
jest.mock('@duelnow/logger')
jest.mock('../utils/kafkaProducer')
jest.mock('@duelnow/utils', () => ({
  ...jest.requireActual('@duelnow/utils'),
  apiResponse: jest.fn(),
  errorResponse: jest.fn(),
  generateCode: jest.fn().mockReturnValue('123456'),
}))

jest.mock('../utils/firebase', () => ({
  updateFirebaseUserEmail: jest.fn(),
}))

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('../utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn(), warn: jest.fn() },
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  expressLogger: jest.fn(),
}))

describe('UsersController', () => {
  let controller: UsersController
  let mockRequest: Partial<Request>

  const mockUser = {
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
    membershipLevelId: 1,
    membershipLevel: {
      levelId: 1,
      feeDeductionPct: 10,
    },
    referrer: {
      walletAddress: '0xa392e8F358cC74AB2d84C10B1dCF91f033c4d8D1',
      membershipLevel: {
        referralBonusPct: 10,
      },
    },
  }

  beforeEach(() => {
    controller = new UsersController()
    mockRequest = { query: {}, headers: {} }
    jest.clearAllMocks()
  })

  describe('getUsers', () => {
    it('should return users with pagination', async () => {
      const mockUsers = [
        {
          ...mockUser,
        },
      ]
      const mockGetUsers = jest.spyOn(UsersService.prototype, 'getUsers').mockResolvedValueOnce({
        users: mockUsers,
        count: 1,
      })

      await controller.getUsers(mockRequest as Request)
      expect(mockGetUsers).toHaveBeenCalledTimes(1)
      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, {
        users: mockUsers,
        pagination: expect.any(Object),
      })
    })

    it('should handle errors', async () => {
      jest.spyOn(UsersService.prototype, 'getUsers').mockRejectedValue(new Error('Some error'))

      const response = await controller.getUsers(mockRequest as Request)
      expect(errorResponse).toHaveBeenCalled()
      expect(response).toBeUndefined()
    })
  })

  describe('getUser', () => {
    it('should return user with unverified email if found in cache', async () => {
      const mockRedisData = JSON.stringify({ email: 'unverified@example.com' })

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(redis, 'getRedisKey').mockResolvedValueOnce(mockRedisData)

      await controller.getUser('1', mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, {
        ...mockUser,
        unverifiedEmail: 'unverified@example.com',
      })
    })

    it('should return NotFound if user does not exist', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(null)

      await controller.getUser('1', mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.NotFound, {
        error: 'User with userId 1 not found',
      })
    })

    it('should handle errors', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByID').mockRejectedValue(new Error('Some error'))

      await controller.getUser('1', mockRequest as Request)
      expect(errorResponse).toHaveBeenCalled()
    })
  })

  describe('patchUser', () => {
    it('should update user and return success response', async () => {
      const patchUserBody = { firstName: 'Jane' }

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(UsersService.prototype, 'updateUserById').mockResolvedValueOnce(mockUser)

      await controller.patchUser('1', patchUserBody, mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, {
        message: 'firstName, updated!',
      })
    })

    it('should update user and return success response', async () => {
      const patchUserBody = { lastName: 'Jane' }

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(UsersService.prototype, 'updateUserById').mockResolvedValueOnce(mockUser)

      await controller.patchUser('1', patchUserBody, mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, {
        message: 'lastName, updated!',
      })
    })

    it('should update user and return success response', async () => {
      const patchUserBody = { nickname: 'Jane' }

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(UsersService.prototype, 'updateUserById').mockResolvedValueOnce(mockUser)

      await controller.patchUser('1', patchUserBody, mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, {
        message: 'nickname, updated!',
      })
    })

    it('should not update nickname if it is already used', async () => {
      const patchUserBody = { nickname: 'Jane' }

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(UsersService.prototype, 'getUserByNickname').mockResolvedValueOnce(mockUser)

      await controller.patchUser('1', patchUserBody, mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, {
        error: `Nickname is already in use.`,
      })
    })

    it('should not update nickname if it is invalid', async () => {
      const patchUserBody = { nickname: 'Jane-123' }

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(UsersService.prototype, 'getUserByNickname').mockResolvedValueOnce(null)

      await controller.patchUser('1', patchUserBody, mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, {
        error: `Invalid nickname. It should only be alphameric.`,
      })
    })

    it('should update user and return success response', async () => {
      const patchUserBody = { handle: 'handle' }

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(UsersService.prototype, 'updateUserById').mockResolvedValueOnce(mockUser)

      await controller.patchUser('1', patchUserBody, mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, {
        message: 'handle, updated!',
      })
    })

    it('should not update handle if it is already used', async () => {
      const patchUserBody = { handle: 'handle' }

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(UsersService.prototype, 'getUserByHandle').mockResolvedValueOnce(mockUser)

      await controller.patchUser('1', patchUserBody, mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, {
        error: `Handle is already in use.`,
      })
    })

    it('should not update handle if it is invalid', async () => {
      const patchUserBody = { handle: 'handle-123' }

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(UsersService.prototype, 'getUserByHandle').mockResolvedValueOnce(null)

      await controller.patchUser('1', patchUserBody, mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, {
        error: `Invalid handle. It should only be alphameric.`,
      })
    })

    it('should not update email if it is used', async () => {
      const patchUserBody = { email: 'test@email.com' }

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(UsersService.prototype, 'getUserByEmail').mockResolvedValueOnce(mockUser)

      await controller.patchUser('1', patchUserBody, mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, {
        error: `Account with email "${patchUserBody.email}" already exists.`,
      })
    })

    it('should update user and return success response', async () => {
      const patchUserBody = { email: 'test@email.com' }

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(UsersService.prototype, 'getUserByEmail').mockResolvedValueOnce(null)
      jest.spyOn(redis, 'setRedisKey').mockResolvedValueOnce('redis-response')

      await controller.patchUser('1', patchUserBody, mockRequest as Request)

      expect(producer.sendMessage).toHaveBeenCalled()
      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, {
        message: 'Email verification link is sent to your new email.',
      })
    })

    it('should return error if user does not exist', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(null)

      const patchUserBody = { firstName: 'Jane' }
      await controller.patchUser('1', patchUserBody, mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.NotFound, {
        error: 'User with userId 1 not found',
      })
    })

    it('should handle errors', async () => {
      const patchUserBody = { firstName: 'Jane' }
      jest.spyOn(UsersService.prototype, 'getUserByID').mockRejectedValue(new Error('Some error'))

      const response = await controller.patchUser('1', patchUserBody, mockRequest as Request)
      expect(errorResponse).toHaveBeenCalled()
      expect(response).toBeUndefined()
    })
  })

  describe('verifyUserEmail', () => {
    it('should verify user email and return success response', async () => {
      jest.clearAllMocks()
      const redisData = JSON.stringify({ vc: '123456', email: 'new@example.com', uid: '123' })

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(redis, 'getRedisKey').mockResolvedValueOnce(redisData)
      jest.spyOn(redis, 'setRedisKey').mockResolvedValueOnce(null)
      jest.spyOn(UsersService.prototype, 'updateUserById').mockResolvedValueOnce(null)

      const response = await controller.verifyUserEmail('1', '123456', mockRequest as Request)
      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, {
        message: 'Email verified successfully!',
      })
      expect(updateFirebaseUserEmail).toHaveBeenCalled()
      expect(response).toBeUndefined()
    })

    it('should return error if verification code is invalid', async () => {
      const redisData = JSON.stringify({ vc: '654321', email: 'new@example.com' })

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(redis, 'getRedisKey').mockResolvedValueOnce(redisData)

      const response = await controller.verifyUserEmail('1', '123456', mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, {
        error: 'Invalid / Expired URL',
      })
      expect(response).toBeUndefined()
    })

    it('should handle errors', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByID').mockRejectedValue(new Error('Some error'))

      const response = await controller.verifyUserEmail('1', '123456', mockRequest as Request)
      expect(errorResponse).toHaveBeenCalled()
      expect(response).toBeUndefined()
    })

    it('should return error if user not found', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(null)

      const response = await controller.verifyUserEmail('1', '123456', mockRequest as Request)

      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, {
        error: `User with userId 1 not found`,
      })
      expect(response).toBeUndefined()
    })
  })

  describe('UsersController - resendVerificationCode', () => {
    it('should resend verification code if cache exists', async () => {
      const mockCache = JSON.stringify({ vc: '123456', email: 'newemail@example.com' })

      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(redis, 'getRedisKey').mockResolvedValueOnce(mockCache)
      jest.spyOn(redis, 'setRedisKey').mockResolvedValueOnce('redis-response')

      const response = await controller.resendVerificationCode('userId1', mockRequest as Request)
      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, {
        message: 'Email verification link is sent to your registered email',
      })
      expect(response).toBeUndefined()
    })

    it('should give error when user not found', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(null)

      const response = await controller.resendVerificationCode('userId1', mockRequest as Request)
      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, {
        error: `User with userId userId1 not found`,
      })
      expect(response).toBeUndefined()
    })

    it('should give error when there is no cache', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)
      jest.spyOn(redis, 'getRedisKey').mockResolvedValueOnce(null)

      const response = await controller.resendVerificationCode('userId1', mockRequest as Request)
      expect(apiResponse).toHaveBeenCalled()
      expect(response).toBeUndefined()
    })

    it('should catch error when service throws error', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByID').mockRejectedValue(new Error('Test rejected'))

      const response = await controller.resendVerificationCode('userId1', mockRequest as Request)
      expect(errorResponse).toHaveBeenCalledWith(ErrorType.CatchError, HttpResponseStatus.BadRequest)
      expect(response).toBeUndefined()
    })
  })

  describe('UsersController - patchTouAndNotif', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    const mockBody = { terms: { accepted: true } }
    it('should update terms of use and notification preferences', async () => {
      UsersService.prototype.getUserByID = jest.fn().mockResolvedValueOnce(mockUser)
      UsersService.prototype.updateUserById = jest.fn().mockResolvedValueOnce(mockUser)

      await controller.patchTouAndNotif('userId1', mockBody, mockRequest as Request)
      expect(apiResponse).toHaveBeenCalled()
    })

    it('should update terms of use and notification preferences if there is no meta', async () => {
      UsersService.prototype.getUserByID = jest.fn().mockResolvedValueOnce({ ...mockUser, meta: '' })
      UsersService.prototype.updateUserById = jest.fn().mockResolvedValueOnce(mockUser)

      await controller.patchTouAndNotif('userId1', mockBody, mockRequest as Request)
      expect(apiResponse).toHaveBeenCalled()
    })

    it('should give error when user not found', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(null)

      const response = await controller.patchTouAndNotif('userId1', mockBody, mockRequest as Request)
      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.NotFound, {
        error: `User with userId userId1 not found`,
      })
      expect(response).toBeUndefined()
    })

    it('should give error when terms not found', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByID').mockResolvedValueOnce(mockUser)

      const response = await controller.patchTouAndNotif('userId1', {}, mockRequest as Request)
      expect(errorResponse).toHaveBeenCalledWith(ErrorType.MissingRequiredField, HttpResponseStatus.BadRequest, {
        error: 'terms should be sent in the body',
      })
      expect(response).toBeUndefined()
    })

    it('should catch error when service throws error', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByID').mockRejectedValue(new Error('Test rejected'))

      const response = await controller.patchTouAndNotif('userId1', mockBody, mockRequest as Request)
      expect(errorResponse).toHaveBeenCalledWith(ErrorType.CatchError, HttpResponseStatus.BadRequest)
      expect(response).toBeUndefined()
    })
  })

  describe('UsersController - getUserByExternelUserId', () => {
    let controller: UsersController

    beforeEach(() => {
      controller = new UsersController()
    })

    it('should return user by external user ID', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByExternalUserId').mockResolvedValueOnce(mockUser)

      await controller.getUserByExternelUserId('externalId1')
      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, mockUser)
    })

    it('should return error when external user ID not found', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByExternalUserId').mockResolvedValueOnce(null)

      await controller.getUserByExternelUserId('externalId1')
      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.NotFound, {
        error: `User with extrenalUserId externalId1 not found`,
      })
    })

    it('should catch error when service throws error', async () => {
      jest.spyOn(UsersService.prototype, 'getUserByExternalUserId').mockRejectedValue(new Error('Test rejected'))

      const response = await controller.getUserByExternelUserId('userId1')
      expect(errorResponse).toHaveBeenCalledWith(ErrorType.CatchError, HttpResponseStatus.BadRequest)
      expect(response).toBeUndefined()
    })
  })

  describe('UsersController - getReferralStats', () => {
    let controller: UsersController

    beforeEach(() => {
      controller = new UsersController()
    })

    it('should return user referralStats', async () => {
      const mockReferralStats = {
        totalReferees: 3,
        totalReferralCommision: {
          USDT: 0.5,
        },
      }

      UsersService.prototype.getReferralStats = jest.fn().mockResolvedValueOnce(mockReferralStats)

      await controller.referralStats('userId1', mockRequest as Request)
      expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, mockReferralStats)
    })

    it('should catch error when service throws error', async () => {
      jest.spyOn(UsersService.prototype, 'getReferralStats').mockRejectedValue(new Error('Test rejected'))

      const response = await controller.referralStats('userId1', mockRequest as Request)
      expect(errorResponse).toHaveBeenCalledWith(ErrorType.CatchError, HttpResponseStatus.BadRequest)
      expect(response).toBeUndefined()
    })
  })
})

describe('UsersController - getPreferences', () => {
  let controller: UsersController

  beforeEach(() => {
    controller = new UsersController()
  })

  it('should return user preferences', async () => {
    const mockPreferences = { id: 'userId1', preferences: {} }

    UsersService.prototype.getPreferences = jest.fn().mockResolvedValueOnce(mockPreferences)

    await controller.getPreferences('userId1')
    expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, mockPreferences)
  })

  it('should catch error when service throws error', async () => {
    jest.spyOn(UsersService.prototype, 'getPreferences').mockRejectedValue(new Error('Test rejected'))

    const response = await controller.getPreferences('userId1')
    expect(errorResponse).toHaveBeenCalledWith(ErrorType.CatchError, HttpResponseStatus.BadRequest, {
      error: new Error('Test rejected'),
    })
    expect(response).toBeUndefined()
  })
})

describe('UsersController - updateUserPreferences', () => {
  let controller: UsersController

  beforeEach(() => {
    controller = new UsersController()
  })

  it('should update the user preferences', async () => {
    const mockPreferences = { id: 'userId1', preferences: {} }
    const mockBody = [
      {
        preferenceId: 1,
        preferenceValue: 'test',
      },
    ]

    UsersService.prototype.updateUserPreference = jest.fn().mockResolvedValueOnce(mockPreferences)

    await controller.updateUserPreferences('userId1', mockBody)
    expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, mockPreferences)
  })

  it('should update the user preferences', async () => {
    const mockBody = [
      {
        preferenceId: 1,
        preferenceValue: 'test',
      },
    ]

    UsersService.prototype.updateUserPreference = jest.fn().mockResolvedValueOnce(null)

    await controller.updateUserPreferences('userId1', mockBody)
    expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.BadRequest, { error: `User preference update failed!` })
  })

  it('should catch error when service throws error', async () => {
    const mockBody = [
      {
        preferenceId: 1,
        preferenceValue: 'test',
      },
    ]
    jest.spyOn(UsersService.prototype, 'updateUserPreference').mockRejectedValue(new Error('Test rejected'))

    const response = await controller.updateUserPreferences('userId1', mockBody)
    expect(errorResponse).toHaveBeenCalledWith(ErrorType.CatchError, HttpResponseStatus.BadRequest, {
      error: new Error('Test rejected'),
    })
    expect(response).toBeUndefined()
  })
})
