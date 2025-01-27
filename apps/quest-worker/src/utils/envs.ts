import * as dotenvExtended from 'dotenv-extended'

dotenvExtended.load({
  path: `.env${process.env.GITHUB_ACTIONS ? '.example' : ''}`,
  errorOnMissing: true,
  includeProcessEnv: true,
})

const env = process.env
const brokers = env.KAFKA_BROKER_URLS
const pointRateUsd = env.POINT_RATE_USD || 0.005
export const envs = { brokers, pointRateUsd }
