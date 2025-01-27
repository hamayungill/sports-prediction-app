import prismaClient from '@duelnow/database'
import { NonRetriableError } from '@duelnow/utils'

import storeIpData from './storeIpData'
import { logger } from '../utils/logger'

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

// Mock the '@duelnow/database' module
jest.mock('@duelnow/database', () => ({
  ipLocation: {
    upsert: jest.fn(),
    updateMany: jest.fn(),
  },
}))

// Mock the 'logger' module
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('storeIpData', () => {
  const mockIpLocationUpsert = jest.fn()
  const mockIpLocationUpdateMany = jest.fn()

  beforeAll(() => {
    prismaClient.ipLocation.upsert = mockIpLocationUpsert
    prismaClient.ipLocation.updateMany = mockIpLocationUpdateMany
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const ipDataSet = {
    ip: '106.51.191.146',
    is_eu: false,
    city: 'Bengaluru',
    region: 'Karnataka',
    region_code: 'KA',
    region_type: 'state',
    country_name: 'India',
    country_code: 'IN',
    continent_name: 'Asia',
    continent_code: 'AS',
    latitude: 12.963399887084961,
    longitude: 77.58550262451172,
    postal: '560010',
    calling_code: '91',
    flag: 'https://ipdata.co/flags/in.png',
    emoji_flag: '🇮🇳',
    emoji_unicode: 'U+1F1EE U+1F1F3',
    asn: {
      asn: 'AS24309',
      name: 'Atria Convergence Technologies PVT Ltd',
      domain: '',
      route: '106.51.184.0/21',
      type: 'business',
    },
    company: {
      name: 'Atria Convergence Technologies PVT Ltd',
      domain: 'actcorp.in',
      network: '106.51.188.0/22',
      type: 'business',
    },
    languages: [
      { name: 'Hindi', native: 'हिन्दी', code: 'hi' },
      { name: 'English', native: 'English', code: 'en' },
    ],
    currency: { name: 'Indian Rupee', code: 'INR', symbol: 'Rs', native: '₹', plural: 'Indian rupees' },
    time_zone: {
      name: 'Asia/Kolkata',
      abbr: 'IST',
      offset: '+0530',
      is_dst: false,
      current_time: '2024-02-22T12:05:48+05:30',
    },
    threat: {
      is_tor: false,
      is_vpn: false,
      is_icloud_relay: false,
      is_proxy: false,
      is_datacenter: false,
      is_anonymous: false,
      is_known_attacker: false,
      is_known_abuser: false,
      is_threat: false,
      is_bogon: false,
      blocklists: [],
      scores: { vpn_score: 1, proxy_score: 0, threat_score: 100, trust_score: 66 },
    },
    count: 1,
    status: 1,
  }

  it('should store IP data successfully and update old records', async () => {
    const expectedIpInfo = {
      ip: ipDataSet.ip,
      country: ipDataSet.country_name,
      state: ipDataSet.region,
      city: ipDataSet.city,
    }

    const mockUpsertResponse = { id: 1, ...expectedIpInfo, isCurrent: true }
    mockIpLocationUpsert.mockResolvedValueOnce(mockUpsertResponse)

    await expect(storeIpData(ipDataSet)).resolves.toEqual(mockUpsertResponse)

    expect(mockIpLocationUpsert).toHaveBeenCalledWith({
      where: {
        unique_icsc: {
          ...expectedIpInfo,
        },
      },
      create: {
        ...expectedIpInfo,
        isCurrent: true,
      },
      update: {
        isCurrent: true,
      },
    })

    expect(mockIpLocationUpdateMany).toHaveBeenCalledWith({
      data: {
        isCurrent: false,
      },
      where: {
        ip: expectedIpInfo.ip,
        isCurrent: true,
        NOT: {
          country: expectedIpInfo.country,
          state: expectedIpInfo.state,
          city: expectedIpInfo.city,
        },
      },
    })

    expect(logger.debug).toHaveBeenCalledWith('storeIpData ip info', expectedIpInfo)
  })

  it('should handle missing region and city by substituting "Not Available"', async () => {
    const ipDataWithoutRegionCity = {
      ...ipDataSet,
      ip: '106.51.191.146',
      country_name: 'India',
      region: '',
      city: '',
    }

    const expectedIpInfo = {
      ip: ipDataWithoutRegionCity.ip,
      country: ipDataWithoutRegionCity.country_name,
      state: 'Not Available',
      city: 'Not Available',
    }

    const mockUpsertResponse = { id: 2, ...expectedIpInfo, isCurrent: true }
    mockIpLocationUpsert.mockResolvedValueOnce(mockUpsertResponse)

    await expect(storeIpData(ipDataWithoutRegionCity)).resolves.toEqual(mockUpsertResponse)

    expect(mockIpLocationUpsert).toHaveBeenCalledWith({
      where: {
        unique_icsc: {
          ...expectedIpInfo,
        },
      },
      create: {
        ...expectedIpInfo,
        isCurrent: true,
      },
      update: {
        isCurrent: true,
      },
    })

    expect(mockIpLocationUpdateMany).toHaveBeenCalledWith({
      data: {
        isCurrent: false,
      },
      where: {
        ip: expectedIpInfo.ip,
        isCurrent: true,
        NOT: {
          country: expectedIpInfo.country,
          state: expectedIpInfo.state,
          city: expectedIpInfo.city,
        },
      },
    })

    expect(logger.debug).toHaveBeenCalledWith('storeIpData ip info', expectedIpInfo)
  })

  it('should log and throw a NonRetriableError if an error occurs', async () => {
    const errorMessage = 'Some error'
    const error = new Error(errorMessage)

    mockIpLocationUpsert.mockRejectedValueOnce(error)

    await expect(storeIpData(ipDataSet)).rejects.toThrow(NonRetriableError)

    expect(logger.error).toHaveBeenCalledWith('storeIpData Error', error)
  })
})
