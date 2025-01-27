import * as bookmaker from './bookmakers'
import prismaClient from '../../index'

jest.mock('../../index', () => ({
  sports: {
    findFirst: jest.fn(),
  },
  bookmakers: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
}))

describe('prepareBookmakersData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return bookmakers data for Baseball when sportId is found', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.sports.findFirst.mockResolvedValueOnce({ sportId: 1 })
    const result = await bookmaker.prepareBookmakersData()

    expect(prismaClient.sports.findFirst).toHaveBeenCalledWith({
      where: { sportName: 'Baseball' },
      select: { sportId: true },
    })
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toMatchObject({
      sportId: 1,
      bookmakerName: '1xbet',
    })
  })

  it('should return an empty array when no sportId is found for Baseball', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.sports.findFirst.mockResolvedValueOnce(null)
    const result = await bookmaker.prepareBookmakersData()

    expect(prismaClient.sports.findFirst).toHaveBeenCalledWith({
      where: { sportName: 'Baseball' },
      select: { sportId: true },
    })
    expect(result).toEqual([])
  })

  it('should prepare data for multiple sports', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.sports.findFirst.mockResolvedValueOnce({ sportId: 1 }) // Baseball
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.sports.findFirst.mockResolvedValueOnce({ sportId: 2 }) // MMA
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.sports.findFirst.mockResolvedValueOnce({ sportId: 3 }) // Soccer

    const result = await bookmaker.prepareBookmakersData()

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((bm) => bm.sportId === 1)).toBe(true) // Checks if Baseball bookmakers are included
    expect(result.some((bm) => bm.sportId === 2)).toBe(true) // Checks if MMA bookmakers are included
    expect(result.some((bm) => bm.sportId === 3)).toBe(true) // Checks if Soccer bookmakers are included
  })
})

describe('seedBookmakers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new bookmaker if it does not exist', async () => {
    const mockBookmakersData = [
      {
        sportId: 1,
        bookmakerName: '1xbet',
        bookmakerApiId: 1,
        logoUrl: '',
        bookmakerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Mock the result of prepareBookmakersData
    jest.spyOn(bookmaker, 'prepareBookmakersData').mockResolvedValue(mockBookmakersData)

    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.bookmakers.findFirst.mockResolvedValueOnce(null)

    await bookmaker.default()

    expect(prismaClient.bookmakers.findFirst).toHaveBeenCalledWith({
      where: {
        bookmakerName: '1xbet',
        sportId: 1,
      },
    })
    expect(prismaClient.bookmakers.create).toHaveBeenCalledWith({
      data: mockBookmakersData[0],
    })
  })

  it('should not create a bookmaker if it already exists', async () => {
    const mockBookmakersData = [
      {
        sportId: 1,
        bookmakerName: '1xbet',
        bookmakerApiId: 1,
        logoUrl: '',
        bookmakerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    jest.spyOn(bookmaker, 'prepareBookmakersData').mockResolvedValue(mockBookmakersData)

    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.bookmakers.findFirst.mockResolvedValueOnce(mockBookmakersData[0])

    await bookmaker.default()

    expect(prismaClient.bookmakers.findFirst).toHaveBeenCalledWith({
      where: {
        bookmakerName: '1xbet',
        sportId: 1,
      },
    })
    expect(prismaClient.bookmakers.create).not.toHaveBeenCalled()
  })

  it('should handle errors when creating a bookmaker', async () => {
    const mockBookmakersData = [
      {
        sportId: 1,
        bookmakerName: '1xbet',
        bookmakerApiId: 1,
        logoUrl: '',
        bookmakerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    jest.spyOn(bookmaker, 'prepareBookmakersData').mockResolvedValue(mockBookmakersData)

    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.bookmakers.findFirst.mockResolvedValueOnce(null)

    // @ts-expect-error mockRejectedValueOnce is part of jest
    prismaClient.bookmakers.create.mockRejectedValueOnce(new Error('Create failed'))

    await expect(bookmaker.default()).rejects.toThrow('Create failed')
  })
})
