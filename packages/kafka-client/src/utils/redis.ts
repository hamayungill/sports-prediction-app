import { RETRY, RetriableError } from '@duelnow/utils'
import { createClient } from 'redis'
import type { RedisClientType } from 'redis'

import { envs } from './envs'
import { logger } from './logger'

export const getRedisClient = async (): Promise<RedisClientType> => {
  const client: RedisClientType = createClient({
    url: envs.redisUrl,
  })
  client.on('error', (err) => logger.error(`Error connecting to redis: ${err}`))
  client.on('connect', () => logger.info(`Redis Connection success`))
  await client.connect()
  return client
}

export const retryHandler = async (userId: string, type: RETRY): Promise<Error | null> => {
  let error: Error | null = null

  if (!userId || typeof userId !== 'string') {
    logger.warn('User ID is missing; will not retry any further.')
    return error
  }

  const redis = await getRedisClient()
  const record = await redis?.get(userId)
  let count = 1

  switch (type) {
    case RETRY.CHECK:
      if (record) error = new RetriableError('')
      break
    case RETRY.DECREMENT:
      if (record) {
        count = parseInt(record) - 1
        if (count < 1) await redis?.del(userId)
        else {
          await redis?.set(userId, count)
        }
      }
      break
    case RETRY.INCREMENT:
      if (record) {
        count = parseInt(record) + 1
      }
      await redis?.set(userId, count)
      break
  }

  return error
}
