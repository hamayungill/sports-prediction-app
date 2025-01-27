import seedMembershipLevels, { membershipLevelsList } from './membershipLevels'
import prismaClient from '../../index'

jest.mock('../../index', () => ({
  membershipLevels: {
    upsert: jest.fn(),
  },
  Prisma: {
    Status: {
      Active: 'Active',
      Inactive: 'Inactive',
    },
  },
}))

// seedMembershipLevels
describe('seedMembershipLevels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should upsert each membership levels with the correct data', async () => {
    await seedMembershipLevels()

    expect(prismaClient.membershipLevels.upsert).toHaveBeenCalledTimes(7)

    membershipLevelsList.forEach((membershipLevel) => {
      expect(prismaClient.membershipLevels.upsert).toHaveBeenCalledWith({
        where: {
          levelId: membershipLevel.levelId,
        },
        create: membershipLevel,
        update: membershipLevel,
      })
    })
  })

  it('should handle duplicate membership IDs correctly', async () => {
    await seedMembershipLevels()

    // @ts-expect-error mock is jest function
    const levelIdZero = prismaClient.membershipLevels.upsert.mock.calls.filter(([call]) => call.where.levelId === 0)

    expect(levelIdZero).toHaveLength(1)
  })
})
