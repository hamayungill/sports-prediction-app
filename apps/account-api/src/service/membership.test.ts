import prismaClient, { Prisma } from '@duelnow/database'
// eslint-disable-next-line import/no-named-as-default
import Decimal from 'decimal.js'

import { MembershipService } from './membership'

const { Status } = Prisma

jest.mock('@duelnow/utils', () => ({
  ...jest.requireActual('@duelnow/utils'),
  generateCode: jest.fn().mockReturnValue('ABC123'),
}))

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('@duelnow/logger')
jest.mock('../utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  checkLogInfo: jest.fn((_headers, fn) => fn()),
  expressLogger: jest.fn(),
}))

describe('getMemberships', () => {
  let service: MembershipService
  beforeEach(() => {
    service = new MembershipService()
    jest.clearAllMocks()
  })
  it('should return memberships data', async () => {
    const mockMembershipLevels = [
      {
        levelId: 0,
        levelName: '',
        description: '',
        eligibilityThreshold: {},
        feeDeductionPct: new Decimal(1.2),
        referralBonusPct: new Decimal(2.1),
        status: Status.Active,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    jest.spyOn(prismaClient.membershipLevels, 'findMany').mockResolvedValue(mockMembershipLevels)

    const result = await service.getMemberships()

    expect(prismaClient.membershipLevels.findMany).toHaveBeenCalledWith({
      where: {
        status: Status.Active,
      },
    })
    expect(result).toEqual(mockMembershipLevels)
  })
})
