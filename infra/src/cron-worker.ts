import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'

import {
  isProduction,
  k8sProvider,
  backendWorkerNamepace,
  backendWorkerConfigMap,
  psql,
  smartContract,
  kafkaUrl,
  infura,
} from './utils/config'
import { github } from './utils/const'

const imageName = 'cron-worker'
const cm = k8s.core.v1.ConfigMap.get(
  'backend-workers-config-map-cron-worker',
  pulumi.interpolate`${backendWorkerNamepace}/${backendWorkerConfigMap}`,
  {
    provider: k8sProvider,
  },
)

// Generate an environment variable that references the value in a ConfigMap
const generateEnvVar = (name: string, oldName?: string): pulumi.Input<k8s.types.input.core.v1.EnvVar> => {
  return {
    name: oldName || name,
    valueFrom: {
      configMapKeyRef: {
        name: cm.metadata.name,
        key: name,
      },
    },
  }
}

// Fetch only key name from configMap
const fetchConfigMapValue = (key: string): pulumi.Output<string> => {
  return cm.data.apply((data) => data[key])
}

const nodeEnv = fetchConfigMapValue('NODE_ENV')
const psqlDbUrl = fetchConfigMapValue('PSQL_URL')
const duelnowPsqlUrl = pulumi
  .all([psql.username, psql.password, psqlDbUrl, psql.name])
  .apply(([user, password, url, name]) => `postgresql://${user}:${password}@${url}/${name}`)

// Define the cron job schedule
const schedule1h = '0 * * * *' // Runs every hour
const schedule15m = '*/15 * * * *' // Runs every 15 minutes
const schedule5m = '*/5 * * * *' // Runs every 5 minutes
const schedule3m = '*/3 * * * *' // Runs every 3 minutes
const schedule2m = '*/2 * * * *' // Runs every 2 minutes

// Create a Kubernetes Secrets
function createImagePullSecret(name: string): k8s.core.v1.Secret {
  return new k8s.core.v1.Secret(
    name,
    {
      type: 'kubernetes.io/dockerconfigjson',
      metadata: {
        name: `ghcr-image-pull-secret-${name}`,
        namespace: backendWorkerNamepace,
      },
      data: {
        '.dockerconfigjson': pulumi.all([github.username, github.token]).apply(([username, token]) => {
          const configJson = {
            auths: {
              'ghcr.io': {
                username: username,
                password: token,
              },
            },
          }
          return Buffer.from(JSON.stringify(configJson)).toString('base64')
        }),
      },
    },
    { provider: k8sProvider },
  )
}

const tag = isProduction.apply((isProduction: boolean) => {
  return isProduction ? 'release' : 'latest'
})

const imageUri = pulumi.interpolate`ghcr.io/${github.orgName}/${imageName}:${tag}`
const imagePullSecret = createImagePullSecret(imageName)

const env = [
  generateEnvVar('AWS_REGION'),
  generateEnvVar('LOG_LEVEL'),
  generateEnvVar('LOGZIO_TOKEN'),
  generateEnvVar('REDIS_URL', 'KAFKA_REDIS_URL'),
  generateEnvVar('SYSTEM_IP'),
  {
    name: 'LAST_RESTART',
    value: new Date().toUTCString(), // restart deployment in case of code change
  },
  {
    name: 'SC_ADMIN_PRIVATE_KEY',
    value: smartContract.admin.privateKey,
  },
  {
    name: 'COINGECKO_API_URL',
    value: smartContract.coinGeckoAPI,
  },
  {
    name: 'COINGECKO_API_KEY',
    value: smartContract.coinGeckoAPIKey,
  },
  {
    name: 'DB_URL',
    value: duelnowPsqlUrl,
  },
  {
    name: 'NODE_ENV',
    value: nodeEnv,
  },
  {
    name: 'KAFKA_BROKER_URLS',
    value: kafkaUrl,
  },
  {
    name: 'INFURA_JWT_KEY_ID',
    value: infura.keyId,
  },
  {
    name: 'INFURA_JWT_PRIVATE_KEY',
    value: infura.privateKey,
  },
]

function createCronJob(
  name: string,
  schedule: string,
  args: string,
  terminationGracePeriodSeconds: number,
): k8s.batch.v1.CronJob {
  return new k8s.batch.v1.CronJob(
    name,
    {
      metadata: {
        name: name,
        namespace: backendWorkerNamepace,
      },
      spec: {
        schedule: schedule,
        jobTemplate: {
          spec: {
            template: {
              spec: {
                terminationGracePeriodSeconds: terminationGracePeriodSeconds,
                imagePullSecrets: [
                  {
                    name: imagePullSecret.metadata.name,
                  },
                ],
                containers: [
                  {
                    name: imageName,
                    image: imageUri,
                    imagePullPolicy: 'Always',
                    command: ['sh', '-c'],
                    args: [args],
                    env: env,
                  },
                ],
                restartPolicy: 'OnFailure',
              },
            },
          },
        },
      },
    },
    { provider: k8sProvider },
  )
}

const cronJobGetEvents = createCronJob(
  'cron-job-get-events',
  schedule15m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/scGetEvents.js',
  30,
)
const cronJobVerifyEvents = createCronJob(
  'cron-job-verify-events',
  schedule15m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/scVerifyEvents.js',
  30,
)
const cronCancelChallengesToCdf = createCronJob(
  'cron-cancel-challenges-to-cdf',
  schedule15m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/cancelChallengesToCdf.js',
  30,
)
const cronUpdateChallengesStatus = createCronJob(
  'cron-update-challenges-status',
  schedule2m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/updateChallengeStatus.js',
  30,
)
const cronCancelChallengesToSc = createCronJob(
  'cron-cancel-challenges-to-sc',
  schedule5m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/cancelChallengesToSc.js',
  30,
)
const cronRefreshView = createCronJob(
  'cron-refresh-view',
  schedule15m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/refreshView.js',
  30,
)
const cronCalculateResults = createCronJob(
  'cron-calculate-results',
  schedule5m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/calculateResults.js',
  30,
)
const cronPublishPickemSC = createCronJob(
  'cron-publish-pickem-sc',
  schedule5m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/publishPickemResultsToSc.js',
  30,
)
const cronPublishResultsCdf = createCronJob(
  'cron-publish-results-cdf',
  schedule3m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/publishResultsToCdf.js',
  30,
)
const cronPublishResultsToSc = createCronJob(
  'cron-publish-results-sc',
  schedule5m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/publishResultsToSc.js',
  30,
)
const cronUpdateNonChallengeGameStatus = createCronJob(
  'cron-update-non-challenge-game-status',
  schedule15m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/updateNonChallengeGameStatus.js',
  30,
)
const cronCancelPostponedChallenges = createCronJob(
  'cron-cancel-postponed-challenge',
  schedule15m,
  'node /app/apps/cron-worker/dist/apps/cron-worker/src/cancelPostponedChallenges.js',
  30,
)

export default createCronJob
