import * as dotenvExtended from 'dotenv-extended'
dotenvExtended.load({
  path: `.env${process.env.GITHUB_ACTIONS ? '.example' : ''}`,
  errorOnMissing: true,
  includeProcessEnv: true,
})

const env = process.env
const brokers = env.KAFKA_BROKER_URLS
const mixpanelEnvs = {
  api: {
    project_token: env.MIXPANEL_PROJECT_TOKEN,
  },
}

export { brokers, mixpanelEnvs }
