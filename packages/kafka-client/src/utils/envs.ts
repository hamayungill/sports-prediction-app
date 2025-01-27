import * as dotenvExtended from 'dotenv-extended'

dotenvExtended.load({
  path: `.env${process.env.GITHUB_ACTIONS ? '.example' : ''}`,
  errorOnMissing: true,
  includeProcessEnv: true,
})

const env = process.env
const brokers = env.KAFKA_BROKER_URLS
const redisUrl = env.KAFKA_REDIS_URL
const opsgenieApiUrl = env.OPSGENIE_API_KEY
const environment = env.NODE_ENV
export const envs = { redisUrl, brokers, opsgenieApiUrl, environment }
