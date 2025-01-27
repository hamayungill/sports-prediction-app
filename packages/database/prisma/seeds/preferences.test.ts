import seedPreferences, { preferencesData } from './preferences'
import prismaClient from '../../index'

jest.mock('../../index', () => ({
  preferences: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
}))

describe('seedPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should find each preference by name', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.preferences.findFirst.mockResolvedValue(null)

    await seedPreferences()

    expect(prismaClient.preferences.findFirst).toHaveBeenCalledTimes(2)

    preferencesData.forEach((preference) => {
      expect(prismaClient.preferences.findFirst).toHaveBeenCalledWith({
        where: { name: preference.name },
      })
    })
  })

  it('should create preferences if they do not exist', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.preferences.findFirst.mockResolvedValue(null)

    await seedPreferences()

    expect(prismaClient.preferences.create).toHaveBeenCalledTimes(2)

    preferencesData.forEach((preference) => {
      expect(prismaClient.preferences.create).toHaveBeenCalledWith({
        data: preference,
      })
    })
  })

  it('should not create a preference if it already exists', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.preferences.findFirst.mockResolvedValue({ name: 'profile_odds_format' })

    await seedPreferences()

    expect(prismaClient.preferences.create).not.toHaveBeenCalledWith({
      data: preferencesData[0],
    })
  })
})
