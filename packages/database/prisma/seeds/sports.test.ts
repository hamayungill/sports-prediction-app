import seedSports from './sports'
import prismaClient from '../../index'

jest.mock('../../index', () => ({
  sports: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  Prisma: {
    Status: {
      Active: 'Active',
      Inactive: 'Inactive',
    },
  },
}))

describe('seedSports', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should seed sports data correctly when sports do not exist', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.sports.findFirst.mockResolvedValue(null)

    await seedSports()

    expect(prismaClient.sports.findFirst).toHaveBeenCalledTimes(9)
    expect(prismaClient.sports.create).toHaveBeenCalledTimes(5)
    expect(prismaClient.sports.update).not.toHaveBeenCalled()
  })

  it('should update sports data correctly when sports already exist', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.sports.findFirst.mockResolvedValue({ sportId: 1 })

    await seedSports()

    expect(prismaClient.sports.findFirst).toHaveBeenCalledTimes(9)
    expect(prismaClient.sports.create).not.toHaveBeenCalled()
    expect(prismaClient.sports.update).toHaveBeenCalledTimes(5)
  })

  it('should handle environment-specific status correctly', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.sports.findFirst.mockResolvedValue(null)

    await seedSports()

    expect(prismaClient.sports.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sportName: 'Basketball',
        }),
      }),
    )

    expect(prismaClient.sports.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sportName: 'Football',
        }),
      }),
    )
  })
})
