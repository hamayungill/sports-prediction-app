import prismaClient from '@duelnow/database'

import { logger } from '../utils/logger'

const { blacklistLocations } = prismaClient

export const isLocationBlocked = async (country: string, region?: string, city?: string): Promise<boolean> => {
  logger.info(`IP middleware location params - country: ${country}, region: ${region}, city: ${city}`)

  if (!country) {
    logger.debug('IP middleware blocked? A', true)
    return true
  }

  try {
    // Fetch relevant blacklisted locations based on block level
    const blacklistedLocations = await blacklistLocations.findMany({
      where: {
        OR: [
          {
            blockLevel: 'Country',
            country: { equals: country, mode: 'insensitive' },
          },
          {
            blockLevel: 'State',
            country: { equals: country, mode: 'insensitive' },
            state: { equals: region, mode: 'insensitive' },
          },
          {
            blockLevel: 'City',
            country: { equals: country, mode: 'insensitive' },
            state: { equals: region, mode: 'insensitive' },
            city: { equals: city, mode: 'insensitive' },
          },
        ],
      },
    })

    if (blacklistedLocations.length === 0) {
      logger.debug('IP middleware blocked? B', false)
      return false
    }

    // Process the blacklisted locations efficiently
    const countryKey = country.toUpperCase()
    const regionKey = region?.toUpperCase()
    const cityKey = city?.toUpperCase()

    for (const data of blacklistedLocations) {
      logger.debug('IP middleware blacklist location data', data)

      if (
        (data?.blockLevel === 'City' &&
          countryKey === data?.country?.toUpperCase() &&
          cityKey === data?.city?.toUpperCase()) ||
        (data?.blockLevel === 'State' &&
          countryKey === data?.country?.toUpperCase() &&
          regionKey === data?.state?.toUpperCase()) ||
        (data?.blockLevel === 'Country' && countryKey === data?.country?.toUpperCase())
      ) {
        logger.debug('IP middleware blocked? C', true)
        return true
      }
    }

    logger.debug('IP middleware blocked? D', false)
    return false
  } catch (err) {
    logger.error('IP middleware error', err)
    return false
  }
}
