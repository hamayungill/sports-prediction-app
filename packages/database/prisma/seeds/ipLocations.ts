import prismaClient from '../../index'

const { ipLocation } = prismaClient

export const ipLocationList = [
  {
    locationId: -1,
    ip: '0.0.0.1',
    country: 'Unknown',
    state: 'Unknown',
    city: 'Unknown',
    isCurrent: true,
  },
  {
    locationId: -2,
    ip: '0.0.0.2',
    country: 'Unknown',
    state: 'Unknown',
    city: 'Unknown',
    isCurrent: true,
  },
  {
    locationId: -3,
    ip: '0.0.0.3',
    country: 'Unknown',
    state: 'Unknown',
    city: 'Unknown',
    isCurrent: true,
  },
  {
    locationId: -4,
    ip: '0.0.0.4',
    country: 'Unknown',
    state: 'Unknown',
    city: 'Unknown',
    isCurrent: true,
  },
]

const seedIpLocations = async (): Promise<void> => {
  for (const ipData of ipLocationList) {
    await ipLocation.upsert({
      where: {
        locationId: ipData.locationId,
      },
      create: ipData,
      update: ipData,
    })
  }
}

export default seedIpLocations
