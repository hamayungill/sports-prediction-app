import prismaClient from '@duelnow/database'

import { isLocationBlocked } from './isLocationBlocked'
import { logger } from '../utils/logger'

// Mock the Prisma client and logger
jest.mock('@duelnow/database', () => ({
  blacklistLocations: {
    findMany: jest.fn(),
  },
}))

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

describe('isLocationBlocked', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return true if country is missing', async () => {
    const result = await isLocationBlocked('')
    expect(result).toBe(true)
    expect(logger.debug).toHaveBeenCalledWith('IP middleware blocked? A', true)
  })

  it('should return false if no blacklisted locations are found', async () => {
    ;(prismaClient.blacklistLocations.findMany as jest.Mock).mockResolvedValue([])
    const result = await isLocationBlocked('USA', 'CA', 'San Francisco')
    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalledWith('IP middleware blocked? B', false)
  })

  it('should return true if a city-level block is found', async () => {
    ;(prismaClient.blacklistLocations.findMany as jest.Mock).mockResolvedValue([
      { blockLevel: 'City', country: 'USA', state: 'CA', city: 'SAN FRANCISCO' },
    ])

    const result = await isLocationBlocked('USA', 'CA', 'San Francisco')
    expect(result).toBe(true)
    expect(logger.debug).toHaveBeenCalledWith('IP middleware blocked? C', true)
  })

  it('should return true if a state-level block is found', async () => {
    ;(prismaClient.blacklistLocations.findMany as jest.Mock).mockResolvedValue([
      { blockLevel: 'State', country: 'USA', state: 'CA' },
    ])

    const result = await isLocationBlocked('USA', 'CA')
    expect(result).toBe(true)
    expect(logger.debug).toHaveBeenCalledWith('IP middleware blocked? C', true)
  })

  it('should return true if a country-level block is found', async () => {
    ;(prismaClient.blacklistLocations.findMany as jest.Mock).mockResolvedValue([
      { blockLevel: 'Country', country: 'USA' },
    ])

    const result = await isLocationBlocked('USA')
    expect(result).toBe(true)
    expect(logger.debug).toHaveBeenCalledWith('IP middleware blocked? C', true)
  })

  it('should return false if no matching block is found', async () => {
    ;(prismaClient.blacklistLocations.findMany as jest.Mock).mockResolvedValue([
      { blockLevel: 'City', country: 'CAN', state: 'ON', city: 'TORONTO' },
    ])

    const result = await isLocationBlocked('USA', 'CA', 'San Francisco')
    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalledWith('IP middleware blocked? D', false)
  })

  it('should return false and log error if an error occurs', async () => {
    ;(prismaClient.blacklistLocations.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

    const result = await isLocationBlocked('USA')
    expect(result).toBe(false)
    expect(logger.error).toHaveBeenCalledWith('IP middleware error', expect.any(Error))
  })
})
