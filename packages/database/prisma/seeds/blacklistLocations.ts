import prismaClient, { Prisma } from '../../index'
const { BlockLevel } = Prisma

const { blacklistLocations } = prismaClient

// Source link
// https://ofac.treasury.gov/sanctions-programs-and-country-information
// https://orpa.princeton.edu/export-controls/sanctioned-countries

// Country must be in ISO Alpha-2 code
const blacklistLocationsData = [
  {
    country: 'CU',
    state: '',
    city: '',
    blockLevel: BlockLevel.Country,
    reason: 'OFAC',
  },
  {
    country: 'IR',
    state: '',
    city: '',
    blockLevel: BlockLevel.Country,
    reason: 'OFAC',
  },
  {
    country: 'KP',
    state: '',
    city: '',
    blockLevel: BlockLevel.Country,
    reason: 'OFAC',
  },
  {
    country: 'RU',
    state: '',
    city: '',
    blockLevel: BlockLevel.Country,
    reason: 'OFAC',
  },
  {
    country: 'SY',
    state: '',
    city: '',
    blockLevel: BlockLevel.Country,
    reason: 'OFAC',
  },
  {
    country: 'US',
    state: 'Michigan',
    city: '',
    blockLevel: BlockLevel.State,
    reason: 'Regulations',
  },
  {
    country: 'US',
    state: 'New Hampshire',
    city: '',
    blockLevel: BlockLevel.State,
    reason: 'Regulations',
  },
  {
    country: 'UA',
    state: 'Crimea',
    city: '',
    blockLevel: BlockLevel.State,
    reason: 'OFAC',
  },
  {
    country: 'UA',
    state: 'Donetsk',
    city: '',
    blockLevel: BlockLevel.State,
    reason: 'OFAC',
  },
  {
    country: 'UA',
    state: 'Luhansk',
    city: '',
    blockLevel: BlockLevel.State,
    reason: 'OFAC',
  },
]

const seedBlacklistLocations = async (): Promise<void> => {
  for (const source of blacklistLocationsData) {
    const blacklistData = await blacklistLocations.findFirst({
      where: {
        country: source.country,
        state: source.state,
        city: source.city,
        blockLevel: source.blockLevel,
        reason: source.reason,
      },
    })
    if (!blacklistData) {
      await blacklistLocations.create({
        data: { ...source },
      })
    }
  }
}

export default seedBlacklistLocations
