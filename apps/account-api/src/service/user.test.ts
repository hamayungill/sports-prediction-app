// TODO: Need to update the unit test for the createMerkleTree

import prismaClient, { Prisma } from '@duelnow/database'
import { GetParams, UserPreference } from '@duelnow/utils'

import { UsersService } from './user'

jest.mock('@duelnow/utils', () => ({
  ...jest.requireActual('@duelnow/utils'),
  generateCode: jest.fn().mockReturnValue('ABC123'),
}))

jest.mock('@duelnow/web3', () => ({
  ...jest.requireActual('@duelnow/web3'),
  generateProof: jest.fn().mockReturnValue(['ABC123']),
}))

jest.mock('../utils/nickname', () => ({
  ...jest.requireActual('../utils/nickname'),
  getUniqueNickname: jest.fn().mockReturnValue('ABC123'),
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

describe('UsersService', () => {
  let service: UsersService

  const mockUser = {
    userId: '5cc785fc-da02-40fc-869e-a1c707c8a70b',
    externalUserId: '0xa387e8F358cC74AB2d84C10B1dCF91f033c4d8D1',
    email: 'test@example.com',
    walletAddress: '0xa392e8F358cC74AB2d84C10B1dCF91f033c4d8D1',
    firstName: null,
    lastName: null,
    nickname: 'ABC123',
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
      feeDeductionPct: 10,
      levelId: 1,
    },
    referrer: {
      membershipLevel: {
        referralBonusPct: 10,
      },
      walletAddress: '0xa392e8F358cC74AB2d84C10B1dCF91f033c4d8D1',
    },
  }

  beforeEach(() => {
    service = new UsersService()
    jest.clearAllMocks()
  })

  describe('getUserByExternalUserId', () => {
    it('should return user data by external user ID', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(mockUser)

      const result = await service.getUserByExternalUserId('externalId1')

      expect(prismaClient.users.findFirst).toHaveBeenCalledWith({
        where: { externalUserId: 'externalId1' },
        include: {
          UserRoles: true,
          membershipLevel: {
            select: {
              levelId: true,
              feeDeductionPct: true,
            },
          },
          referrer: {
            select: {
              walletAddress: true,
              membershipLevel: {
                select: {
                  referralBonusPct: true,
                },
              },
            },
          },
        },
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null if user is not found', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(null)

      const result = await service.getUserByExternalUserId('externalId1')

      expect(result).toBeNull()
    })
  })

  describe('getUserByWalletAddress', () => {
    it('should return user data by wallet address', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(mockUser)

      const result = await service.getUserByWalletAddress('walletAddress1')

      expect(prismaClient.users.findFirst).toHaveBeenCalledWith({
        where: { walletAddress: 'walletAddress1' },
        include: { UserRoles: true },
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null if user is not found', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(null)

      const result = await service.getUserByWalletAddress('walletAddress1')

      expect(result).toBeNull()
    })
  })

  describe('getUserByID', () => {
    it('should return user data by user ID', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(mockUser)

      const result = await service.getUserByID('1')

      expect(prismaClient.users.findFirst).toHaveBeenCalledWith({
        where: { userId: '1' },
        include: {
          UserRoles: true,
          membershipLevel: {
            select: {
              levelId: true,
              feeDeductionPct: true,
            },
          },
          referrer: {
            select: {
              walletAddress: true,
              membershipLevel: {
                select: {
                  referralBonusPct: true,
                },
              },
            },
          },
        },
      })
      expect(result).toEqual({ ...mockUser, proof: ['ABC123'] })
    })

    it('should return null if user is not found', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(null)

      const result = await service.getUserByID('1')

      expect(result).toBeNull()
    })

    it('should return selected fields if select is provided', async () => {
      const select = { firstName: true, lastName: true }
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(mockUser)

      const result = await service.getUserByID('1', select)

      expect(prismaClient.users.findFirst).toHaveBeenCalledWith({
        where: { userId: '1' },
        select,
      })
      expect(result).toEqual({ ...mockUser, proof: ['ABC123'] })
    })
  })

  describe('getUserByEmail', () => {
    it('should return user data by email', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(mockUser)

      const result = await service.getUserByEmail('email@example.com')

      expect(prismaClient.users.findFirst).toHaveBeenCalledWith({
        where: { email: 'email@example.com' },
        include: { UserRoles: true },
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null if user is not found', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(null)

      const result = await service.getUserByEmail('email@example.com')

      expect(result).toBeNull()
    })
  })

  describe('getUserByNickname', () => {
    it('should return user data by nickname', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(mockUser)

      const result = await service.getUserByNickname('nickname1')

      expect(prismaClient.users.findFirst).toHaveBeenCalledWith({
        where: {
          nickname: {
            equals: 'nickname1',
            mode: 'insensitive',
          },
        },
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null if user is not found', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(null)

      const result = await service.getUserByNickname('nickname1')

      expect(result).toBeNull()
    })
  })

  describe('getUserByHandle', () => {
    it('should return user data by handle', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(mockUser)

      const result = await service.getUserByHandle('handle1')

      expect(prismaClient.users.findFirst).toHaveBeenCalledWith({
        where: {
          handle: {
            equals: 'handle1',
            mode: 'insensitive',
          },
        },
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null if user is not found', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(null)

      const result = await service.getUserByHandle('handle1')

      expect(result).toBeNull()
    })
  })

  describe('getUsers', () => {
    it('should return users and count', async () => {
      const mockUsers = [{ ...mockUser }]
      const mockCount = 1
      jest.spyOn(prismaClient.users, 'findMany').mockResolvedValue(mockUsers)
      jest.spyOn(prismaClient.users, 'count').mockResolvedValue(mockCount)

      const params: GetParams = { filter: {}, sort: {}, skip: 0, take: 10 }
      const result = await service.getUsers(params)

      expect(prismaClient.users.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: {
          UserRoles: true,
          membershipLevel: {
            select: {
              levelId: true,
              feeDeductionPct: true,
            },
          },
          referrer: {
            select: {
              walletAddress: true,
              membershipLevel: {
                select: {
                  referralBonusPct: true,
                },
              },
            },
          },
        },
        where: {},
        orderBy: {},
      })
      expect(prismaClient.users.count).toHaveBeenCalledWith({ where: {} })
      expect(result).toEqual({ users: mockUsers, count: mockCount })
    })
  })

  describe('create', () => {
    xit('should create a new user and return the user data', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(null)
      jest.spyOn(prismaClient.users, 'create').mockResolvedValue(mockUser)

      const userCreationModel = {
        externalUserId: 'externalId1',
        email: 'email@example.com',
        walletAddress: 'walletAddress1',
        firstName: 'First',
        lastName: 'Last',
        isEmailVerified: true,
      }

      await service.create(userCreationModel)

      expect(prismaClient.users.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ walletAddress: 'walletAddress1' }, { externalUserId: 'externalId1' }],
        },
        select: {
          walletAddress: true,
          externalUserId: true,
        },
      })
      expect(prismaClient.users.create).toHaveBeenCalled()
    })

    xit('should create a new user with given nickname', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(null)
      jest.spyOn(prismaClient.users, 'create').mockResolvedValue(mockUser)

      const userCreationModel = {
        externalUserId: 'externalId1',
        email: 'email@example.com',
        walletAddress: 'walletAddress1',
        firstName: 'First',
        lastName: 'Last',
        isEmailVerified: true,
        nickname: 'nickname',
      }

      await service.create(userCreationModel)

      expect(prismaClient.users.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ walletAddress: 'walletAddress1' }, { externalUserId: 'externalId1' }],
        },
        select: {
          walletAddress: true,
          externalUserId: true,
        },
      })
      expect(prismaClient.users.create).toHaveBeenCalled()
    })

    it('should give error when given referrerCode already exists', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(null)

      const userCreationModel = {
        externalUserId: 'externalId1',
        email: 'email@example.com',
        walletAddress: 'walletAddress1',
        firstName: 'First',
        lastName: 'Last',
        isEmailVerified: true,
        referrerCode: 'ABC123',
      }
      try {
        await service.create(userCreationModel)
      } catch (err) {
        expect(err).toStrictEqual(new Error('Invalid referrerCode!'))
      }
    })

    xit('should create unique name and pass invite code', async () => {
      const userCreationModel = {
        externalUserId: 'externalId1',
        email: 'email@example.com',
        walletAddress: 'walletAddress1',
        firstName: 'First',
        lastName: 'Last',
        isEmailVerified: true,
      }
      jest
        .spyOn(prismaClient.users, 'findFirst')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, referralCode: 'ABC123' })
      jest.spyOn(prismaClient.users, 'create').mockResolvedValue({ ...mockUser, ...userCreationModel })

      await service.create(userCreationModel)
      expect(prismaClient.users.create).toHaveBeenCalled()
    })

    it('should throw an error if user already exists', async () => {
      jest.spyOn(prismaClient.users, 'findFirst').mockResolvedValue(mockUser)

      const userCreationModel = {
        externalUserId: 'externalId1',
        email: 'email@example.com',
        walletAddress: 'walletAddress1',
        firstName: 'First',
        lastName: 'Last',
        isEmailVerified: true,
      }

      await expect(service.create(userCreationModel)).rejects.toThrow(`User with externalUserId already exists.`)
    })
  })

  describe('updateUserById', () => {
    it('should update user by ID and return the updated data', async () => {
      jest.spyOn(prismaClient.users, 'update').mockResolvedValue(mockUser)

      const userData = { firstName: 'Updated' }
      const result = await service.updateUserById('1', userData)

      expect(prismaClient.users.update).toHaveBeenCalledWith({
        where: { userId: '1' },
        data: userData,
      })
      expect(result).toEqual(mockUser)
    })
  })

  describe('updateUserPreference', () => {
    it('should update user preferences and return updated and failed preferences', async () => {
      const mockPreferences: UserPreference[] = [{ preferenceId: 1, preferenceValue: 'value1' }]
      jest.spyOn(prismaClient.userPreferences, 'upsert').mockResolvedValue({
        userId: 'string',
        preferenceId: 1,
        value: 'value1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.updateUserPreference('1', mockPreferences)

      expect(prismaClient.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId_preferenceId: { userId: '1', preferenceId: 1 } },
        create: { userId: '1', preferenceId: 1, value: 'value1' },
        update: { value: 'value1' },
      })
      expect(result).toEqual({
        updatedPreference: mockPreferences,
        failedPreferences: [],
      })
    })

    it('should log an error and return failed preferences if upsert fails', async () => {
      const mockPreferences: UserPreference[] = [{ preferenceId: 1, preferenceValue: 'value1' }]
      jest.spyOn(prismaClient.userPreferences, 'upsert').mockRejectedValue(new Error('Upsert error'))

      const result = await service.updateUserPreference('1', mockPreferences)

      expect(result).toEqual({
        updatedPreference: [],
        failedPreferences: mockPreferences,
      })
    })
  })

  describe('getPreferences', () => {
    it('should return user preferences data', async () => {
      const mockPreferences = [
        {
          preferenceId: 1,
          name: 'preference1',
          value: 'defaultValue',
          UserPreferences: [{ value: 'userValue1' }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      jest.spyOn(prismaClient.preferences, 'findMany').mockResolvedValue(mockPreferences)

      const result = await service.getPreferences('1')

      expect(prismaClient.preferences.findMany).toHaveBeenCalledWith({
        select: {
          preferenceId: true,
          name: true,
          value: true,
          UserPreferences: {
            where: { userId: '1' },
            select: { value: true },
          },
        },
      })
      expect(result).toEqual([
        {
          preferenceId: 1,
          name: 'preference1',
          value: 'defaultValue',
          userSelectedPreference: 'userValue1',
        },
      ])
    })
  })

  describe('getWaitlistInviteCodeInfo', () => {
    it('should return waitlist invite code info', async () => {
      const mockWaitlist = {
        inviteCode: 'inviteCode1',
        email: 'test@email.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        waitlistId: 1,
        isApplied: false,
      }
      jest.spyOn(prismaClient.waitlist, 'findFirst').mockResolvedValue(mockWaitlist)

      const result = await service.getWaitlistInviteCodeInfo('inviteCode1')

      expect(prismaClient.waitlist.findFirst).toHaveBeenCalledWith({
        where: { inviteCode: 'inviteCode1' },
      })
      expect(result).toEqual(mockWaitlist)
    })

    it('should return null if invite code is not found', async () => {
      jest.spyOn(prismaClient.waitlist, 'findFirst').mockResolvedValue(null)

      const result = await service.getWaitlistInviteCodeInfo('inviteCode1')

      expect(result).toBeNull()
    })
  })

  describe('getReferralStats', () => {
    const userId = 'testUserId'

    it("should return user referral stats for today's filter", async () => {
      const filter = 'today'
      const mockReferralStats = {
        totalReferees: 2,
        totalReferralCommision: {
          USDT: 0.175,
          ETH: 0.025,
        },
      }

      jest.spyOn(prismaClient, '$queryRawUnsafe').mockResolvedValue([
        {
          raw_data: {
            tokenType: 'USDT',
            referrers: ['walletAddress1'],
            referrelCommissions: [{ originalStakedQty: 0.175, tokenType: 'USDT' }],
          },
          walletAddress: 'walletAddress1',
        },
        {
          raw_data: {
            tokenType: 'ETH',
            referrers: ['walletAddress2'],
            referrelCommissions: [{ originalStakedQty: 0.025, tokenType: 'ETH' }],
          },
          walletAddress: 'walletAddress2',
        },
      ])

      jest.spyOn(prismaClient.users, 'count').mockResolvedValue(mockReferralStats.totalReferees)

      const today = new Date()
      const dateFilter = { gte: new Date(today.toISOString().split('T')[0]) }
      const result = await service.getReferralStats(userId, filter)

      expect(prismaClient.$queryRawUnsafe).toHaveBeenCalled()
      expect(prismaClient.users.count).toHaveBeenCalledWith({
        where: { referrerUserId: userId, createdAt: dateFilter },
      })
      expect(result).toEqual(mockReferralStats)
    })

    it('should return user referral stats for month filter', async () => {
      const filter = 'month'
      const mockReferralStats = {
        totalReferees: 3,
        totalReferralCommision: {
          USDT: 0.5,
        },
      }

      jest.spyOn(prismaClient, '$queryRawUnsafe').mockResolvedValue([
        {
          raw_data: {
            tokenType: 'USDT',
            referrers: ['walletAddress1'],
            referrelCommissions: [{ originalStakedQty: 0.5, tokenType: 'USDT' }],
          },
          walletAddress: 'walletAddress1',
        },
      ])

      jest.spyOn(prismaClient.users, 'count').mockResolvedValue(mockReferralStats.totalReferees)

      const dateFilter = {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      }
      const result = await service.getReferralStats(userId, filter)

      expect(prismaClient.$queryRawUnsafe).toHaveBeenCalled()
      expect(prismaClient.users.count).toHaveBeenCalledWith({
        where: { referrerUserId: userId, createdAt: dateFilter },
      })
      expect(result).toEqual(mockReferralStats)
    })

    it('should return user referral stats for empty filter', async () => {
      const filter = ''
      const mockReferralStats = {
        totalReferees: 5,
        totalReferralCommision: {
          BTC: 1.0,
          USDT: 0.3,
        },
      }

      jest.spyOn(prismaClient, '$queryRawUnsafe').mockResolvedValue([
        {
          raw_data: {
            tokenType: 'BTC',
            referrers: ['walletAddress1'],
            referrelCommissions: [{ originalStakedQty: 1.0, tokenType: 'BTC' }],
          },
          walletAddress: 'walletAddress1',
        },
        {
          raw_data: {
            tokenType: 'USDT',
            referrers: ['walletAddress2'],
            referrelCommissions: [{ originalStakedQty: 0.3, tokenType: 'USDT' }],
          },
          walletAddress: 'walletAddress2',
        },
      ])

      jest.spyOn(prismaClient.users, 'count').mockResolvedValue(mockReferralStats.totalReferees)

      const result = await service.getReferralStats(userId, filter)

      expect(prismaClient.$queryRawUnsafe).toHaveBeenCalled()
      expect(prismaClient.users.count).toHaveBeenCalledWith({ where: { referrerUserId: userId, createdAt: {} } })
      expect(result).toEqual(mockReferralStats)
    })
  })
})
