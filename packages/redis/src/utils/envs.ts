import * as dotenvExtended from 'dotenv-extended'

dotenvExtended.load({
  path: `.env${process.env.GITHUB_ACTIONS ? '.example' : ''}`,
  errorOnMissing: true,
  includeProcessEnv: true,
})

const env = process.env
const redisUrl = env.KAFKA_REDIS_URL
export const envs = { redisUrl }
