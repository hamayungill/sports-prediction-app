import { SetOptions, createClient } from 'redis'
import type { RedisClientType } from 'redis'

import { envs } from './utils/envs'
import { logger } from './utils/logger'

let client: RedisClientType

export const getRedisClient = async (): Promise<RedisClientType> => {
  if (!client) {
    client = createClient({
      url: envs.redisUrl,
    })
    client.on('error', (err) => logger.error(`Error connecting to redis: ${err}`))
    client.on('connect', () => logger.info(`Redis Connection success`))
    await client.connect()
  }
  return client
}

export const getRedisKey = async (key: string): Promise<string | null> => {
  const redisClient: RedisClientType = await getRedisClient()
  if (!redisClient) {
    throw new Error('Redis client is not initialized')
  }
  return await redisClient.get(key)
}

export const removeRedisKey = async (key: string): Promise<number | null> => {
  const redisClient: RedisClientType = await getRedisClient()
  if (!redisClient) {
    throw new Error('Redis client is not initialized')
  }
  return await redisClient.del(key)
}

export const setRedisKey = async (key: string, value: string, ttl?: number): Promise<string | null> => {
  const redisClient: RedisClientType = await getRedisClient()
  if (!redisClient) {
    throw new Error('Redis client is not initialized')
  }
  if (ttl) {
    const options: SetOptions = { EX: ttl }
    const resp = await redisClient.set(key, value, options)
    return resp
  } else {
    const resp = await redisClient.set(key, value)
    return resp
  }
}
