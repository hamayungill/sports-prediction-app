import * as dotenvExtended from 'dotenv-extended'

dotenvExtended.load({
  path: `.env${process.env.GITHUB_ACTIONS ? '.example' : ''}`,
  errorOnMissing: true,
  includeProcessEnv: true,
})

const env = process.env
const { KAFKA_BROKER_URLS } = env

export const envs = { KAFKA_BROKER_URLS }
