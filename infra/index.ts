import { accountApi } from './src/account-api'
import { alertWorker } from './src/alert-worker'
import cronjobs from './src/cron-worker'
import { customerIoWorker } from './src/customerio-worker'
import { eventWorker } from './src/event-worker'
import { exposedApi } from './src/exposed-api'
import { createK8sDeployment } from './src/k8s'
import { createK8sDeployment as deployment } from './src/k8s-workers'
import { mixpanelWorker } from './src/mixpanel-worker'
import { questWorker } from './src/quest-worker'
import { retryWorker } from './src/retry-worker'
import { sportsApi } from './src/sports-api'
import { sportsWorker } from './src/sports-worker'

//EKS Deployment
exposedApi
accountApi
customerIoWorker
sportsApi
sportsWorker
mixpanelWorker
cronjobs
eventWorker
retryWorker
questWorker
alertWorker
createK8sDeployment
deployment

export const exposedApiUrl = exposedApi.status.apply((status: any) => status.loadBalancer.ingress[0].hostname)