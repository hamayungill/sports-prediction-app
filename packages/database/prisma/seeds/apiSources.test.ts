import seedApiSources from './apiSources'
import prismaClient from '../../index'

jest.mock('../../index', () => ({
  apiSources: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
}))

describe('seedApiSources', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new API source if it does not exist', async () => {
    const mockApiSourceData = {
      apiSourceName: 'api-nba-v1.p.rapidapi.com',
      isActive: true,
    }

    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.apiSources.findFirst.mockResolvedValueOnce(null)

    await seedApiSources()

    expect(prismaClient.apiSources.findFirst).toHaveBeenCalledWith({
      where: {
        apiSourceName: mockApiSourceData.apiSourceName,
      },
    })
    expect(prismaClient.apiSources.create).toHaveBeenCalledWith({
      data: mockApiSourceData,
    })
  })

  it('should not create an API source if it already exists', async () => {
    const mockApiSourceData = {
      apiSourceName: 'api-nba-v1.p.rapidapi.com',
      isActive: true,
    }

    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.apiSources.findFirst.mockResolvedValueOnce(mockApiSourceData)

    await seedApiSources()

    expect(prismaClient.apiSources.findFirst).toHaveBeenCalledWith({
      where: {
        apiSourceName: mockApiSourceData.apiSourceName,
      },
    })
  })

  it('should handle errors during API source creation', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.apiSources.findFirst.mockResolvedValueOnce(null)
    // @ts-expect-error mockRejectedValueOnce is part of jest
    prismaClient.apiSources.create.mockRejectedValueOnce(new Error('Create failed'))

    await expect(seedApiSources()).rejects.toThrow('Create failed')
  })

  it('should create multiple new API sources if they do not exist', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.apiSources.findFirst.mockResolvedValue(null) // Simulate no existing sources

    await seedApiSources()

    // There are 5 apiSources in the array, so 5 calls to findFirst and create should be made
    expect(prismaClient.apiSources.findFirst).toHaveBeenCalledTimes(5)
    expect(prismaClient.apiSources.create).toHaveBeenCalledTimes(5)
  })

  it('should create only missing API sources', async () => {
    const existingApiSource = {
      apiSourceName: 'api-nba-v1.p.rapidapi.com',
      isActive: true,
    }

    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.apiSources.findFirst.mockResolvedValueOnce(existingApiSource).mockResolvedValue(null)

    await seedApiSources()

    expect(prismaClient.apiSources.findFirst).toHaveBeenCalledTimes(5)
    expect(prismaClient.apiSources.create).toHaveBeenCalledTimes(4) // One already exists, so only 4 should be created
  })
})
