import seedRoles from './roles'
import prismaClient from '../../index'

jest.mock('../../index', () => ({
  roles: {
    upsert: jest.fn(),
  },
}))

describe('seedRoles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call upsert with correct parameters', async () => {
    await seedRoles()

    expect(prismaClient.roles.upsert).toHaveBeenCalledTimes(1)
    expect(prismaClient.roles.upsert).toHaveBeenCalledWith({
      where: {
        roleName: 'user',
      },
      create: {
        roleName: 'user',
      },
      update: {
        updatedAt: expect.any(Date),
      },
    })
  })

  it('should update the `updatedAt` field with the current date', async () => {
    const currentDate = new Date()
    jest.spyOn(global, 'Date').mockImplementationOnce(() => currentDate)

    await seedRoles()

    expect(prismaClient.roles.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          updatedAt: currentDate,
        },
      }),
    )
  })
})
