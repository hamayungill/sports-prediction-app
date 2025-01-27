import prismaClient, { Prisma } from '@duelnow/database'
import { NonRetriableError } from '@duelnow/utils'
import { LookupResponse } from 'ipdata'

import { logger } from '../utils/logger'

const { ipLocation } = prismaClient

const storeIpData = async (ipData: LookupResponse): Promise<Prisma.IpLocation> => {
  try {
    const ipInfo = {
      ip: ipData.ip,
      country: ipData.country_name,
      state: ipData.region || 'Not Available',
      city: ipData.city || 'Not Available',
    }

    logger.debug('storeIpData ip info', ipInfo)

    /**
     * Using upsert to make sure no duplicate data is added to the DB.
     * eg: if the ip information (ip, country, state, city) we received from the ipData tool is already available
     * in the DB it will be checked by the unique attribute (unique_icsc) and then it will just update isCurrent as true
     * else the new entry will be created in the DB.
     * */
    const ipLocationResp = await ipLocation.upsert({
      where: {
        unique_icsc: {
          ...ipInfo,
        },
      },
      create: {
        ...ipInfo,
        isCurrent: true,
      },
      update: {
        isCurrent: true,
      },
    })

    /**
     * This updateMany will update the isCurrent field to false which are old records stored in the DB.
     * eg: We store the ip information in the db and later the ip address is assigned to new location when that
     * happens we have to mark isCurrent to false.
     * This step will find all the old records which are assigned to the current ip and mark all those records as non active
     */
    await ipLocation.updateMany({
      data: {
        isCurrent: false,
      },
      where: {
        ip: ipInfo.ip,
        isCurrent: true,
        NOT: {
          country: ipInfo.country,
          state: ipInfo.state,
          city: ipInfo.city,
        },
      },
    })
    return ipLocationResp
  } catch (err) {
    logger.error('storeIpData Error', err)
    throw new NonRetriableError(`storeIpData Error. ${JSON.stringify(err)}`)
  }
}

export default storeIpData
