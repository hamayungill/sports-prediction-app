const env = process.env

const github = {
  username: env.GITHUB_USERNAME,
  token: env.GITHUB_TOKEN,
  orgName: 'duelnow',
}

const checkDeploy = {
  accountApi: env.ACCOUNT_API_DEPLOY,
  sportsApi: env.SPORTS_API_DEPLOY,
  exposedApi: env.EXPOSED_API_DEPLOY,
  sportsWorker: env.SPORTS_WORKER_DEPLOY,
  alertWorker: env.ALERT_WORKER_DEPLOY,
  customerioWorker: env.CUSTOMERIO_WORKER_DEPLOY,
  eventWorker: env.EVENT_WORKER_DEPLOY,
  mixpanelWorker: env.MIXPANEL_WORKER_DEPLOY,
  questWorker: env.QUEST_WORKER_DEPLOY,
  retryWorker: env.RETRY_WORKER_DEPLOY,
}

export { github, checkDeploy }