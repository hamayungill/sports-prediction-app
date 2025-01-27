import * as dotenvExtended from 'dotenv-extended'

import { getRedisClient, getRedisKey, setRedisKey } from './redis'
import { logger } from './utils/logger'

jest.mock('redis')

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('@duelnow/logger', () => ({
  Logger: jest.fn(),
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  getLogger: jest.fn(),
}))

jest.mock('./utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  correlationIdMiddleware: jest.fn(),
}))

jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    get: jest.fn().mockImplementation(() => {
      return Promise.resolve('')
    }),
    del: jest.fn().mockImplementation(() => {
      return Promise.resolve('')
    }),
    set: jest.fn().mockImplementation(() => {
      return Promise.resolve('')
    }),
  })),
}))

describe('Redis Functions', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getRedisClient', () => {
    it('should create a Redis client and handle connect and error events', async () => {
      const mockRedisClient = await getRedisClient()

      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockRedisClient.connect).toHaveBeenCalled()

      const [[errorEvent, errorHandler], [connectEvent, connectHandler]] = (mockRedisClient.on as jest.Mock).mock.calls

      expect(errorEvent).toBe('error')
      expect(connectEvent).toBe('connect')

      const error = new Error('test error')
      errorHandler(error)
      expect(logger.error).toHaveBeenCalledWith(`Error connecting to redis: ${error}`)

      connectHandler()
      expect(logger.info).toHaveBeenCalledWith('Redis Connection success')
      expect(mockRedisClient.on).toHaveBeenCalled()
    })
    it('loads .env.example file when GITHUB_ACTIONS is set', () => {
      process.env.GITHUB_ACTIONS = 'true'

      jest.isolateModules(() => {
        require('./utils/envs') // Adjust the path to your env file if necessary
      })

      expect(dotenvExtended.load).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '.env.example',
        }),
      )
    })
  })

  describe('setRedisData', () => {
    it('should set data in Redis', async () => {
      const key = 'name'
      const value = 'Yaman Nasser'

      const mockRedisClient = await getRedisClient()

      await setRedisKey(key, value)
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value)
    })

    it('should set data in Redis with ttl(time-to-live) span', async () => {
      const key = 'name'
      const value = 'Yaman Nasser'
      const ttl = 60

      const mockRedisClient = await getRedisClient()

      await setRedisKey(key, value, ttl)
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value, { EX: 60 })
    })

    it('should throw an error if Redis client is not initialized while setting key', async () => {
      jest.spyOn(require('./redis'), 'getRedisClient').mockResolvedValueOnce(null) // eslint-disable-line @typescript-eslint/no-var-requires

      const key = 'name'
      const value = 'Yaman Nasser'

      await expect(setRedisKey(key, value)).rejects.toThrow('Redis client is not initialized')
    })
  })

  describe('getRedisData', () => {
    it('should get data from Redis', async () => {
      const key = 'name'

      const mockRedisClient = await getRedisClient()
      await getRedisKey(key)
      expect(mockRedisClient.get).toHaveBeenCalledWith(key)
    })
  })

  it('should throw an error if Redis client is not initialized while getting key', async () => {
    jest.spyOn(require('./redis'), 'getRedisClient').mockResolvedValueOnce(null) // eslint-disable-line @typescript-eslint/no-var-requires
    const key = 'name'
    await expect(getRedisKey(key)).rejects.toThrow('Redis client is not initialized')
  })
})
