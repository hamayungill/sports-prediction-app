import * as dotenvExtended from 'dotenv-extended'

dotenvExtended.load({
  errorOnMissing: true,
  includeProcessEnv: true,
})
const env = process.env

const LOG_LEVEL: string | undefined = env.LOG_LEVEL
const LOGZIO_TOKEN: string | undefined = env.LOGZIO_TOKEN

export { LOGZIO_TOKEN, LOG_LEVEL }
