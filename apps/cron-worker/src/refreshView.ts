import prismaClient from '@duelnow/database'

import { logger } from './utils'

const refreshMaterializedView = async (): Promise<undefined> => {
  try {
    logger.info('Starting view refresh')
    const result = await prismaClient.$executeRawUnsafe(
      `REFRESH MATERIALIZED VIEW CONCURRENTLY sport.sports_stage_status_data`,
    )
    logger.info('View refreshed: ', result)
  } catch (error) {
    logger.error('View refresh error: ', error)
    process.exit(1)
  }

  logger.info('View refresh cron stopped running.')
  process.exit(0) // Forcefully exiting the process for POD
}

refreshMaterializedView()
