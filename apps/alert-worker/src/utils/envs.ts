import * as dotenvExtended from 'dotenv-extended'

const env = process.env

dotenvExtended.load({
  path: `.env${process.env.GITHUB_ACTIONS ? '.example' : ''}`,
  errorOnMissing: true,
  includeProcessEnv: true,
})

const brokers = env.KAFKA_BROKER_URLS
const environment = env.NODE_ENV
const opsgenieApiKey = env.OPSGENIE_API_KEY
const opsgenieDataApiKey = env.OPSGENIE_DATA_API_KEY

export const envs = { brokers, environment, opsgenieApiKey, opsgenieDataApiKey }
