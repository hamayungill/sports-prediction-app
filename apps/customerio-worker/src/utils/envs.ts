import * as dotenvExtended from 'dotenv-extended'
dotenvExtended.load({
  path: `.env${process.env.GITHUB_ACTIONS ? '.example' : ''}`,
  errorOnMissing: true,
  includeProcessEnv: true,
})

const env = process.env
const brokers = env.KAFKA_BROKER_URLS
const customerioEnvs = {
  api: {
    key: env.CUSTOMERIO_API_KEY,
    url: env.CUSTOMERIO_API_URL,
    broadcastUrl: env.CUSTOMERIO_BROADCAST_API_URL,
    siteId: env.CUSTOMERIO_SITE_ID,
    appKey: env.CUSTOMERIO_APP_KEY,
    broadcastId: env.CUSTOMERIO_WAITLIST_BROADCAST_ID,
  },
}

export { brokers, customerioEnvs }
