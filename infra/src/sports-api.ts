import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import { createK8sDeployment, createK8sService } from './k8s'
import {
  backendConfigMap,
  backendNamespace,
  isProduction,
  k8sProvider,
  kafkaUrl,
  ports,
  psql,
  smartContract,
} from './utils/config'
import { checkDeploy } from './utils/const'

const imageName = 'sports-api'
const restart: boolean = checkDeploy.sportsApi === 'true'

// Get the existing Deployment to fetch the LAST_RESTART value
const existingDeployment = k8s.apps.v1.Deployment.get(
  `${imageName}-old-deployment`,
  pulumi.interpolate`${backendNamespace}/${imageName}`,
  {
    provider: k8sProvider,
  },
)

// Fetch the LAST_RESTART value if it exists, otherwise use an empty string
const lastRestart = existingDeployment.spec.template.spec.containers[0].env.apply((envVars) => {
  const lastRestartVar = envVars.find((env) => env.name === 'LAST_RESTART')
  return lastRestartVar ? lastRestartVar.value : '' // Use the previous value or an empty string
})

backendConfigMap.apply((v) => {
  const cm = k8s.core.v1.ConfigMap.get(
    'existing-dn-data-config-map-sports-api',
    pulumi.interpolate`${backendNamespace}/${v}`,
    {
      provider: k8sProvider,
    },
  )
  const cmName = cm.metadata.name

  // Generate an environment variables that references to the value in a ConfigMap
  const generateEnvVar = (name: string, oldName?: string): pulumi.Input<k8s.types.input.core.v1.EnvVar> => {
    return {
      name: oldName || name,
      valueFrom: {
        configMapKeyRef: {
          name: cmName,
          key: name,
        },
      },
    }
  }

  const enableSwaggerValue: pulumi.Output<string> = isProduction.apply((value) => (value ? 'false' : 'true'))

  // Fetch only key name from configMap
  const fetchConfigMapValue = (key: string): pulumi.Output<string> => {
    return cm.data[key]
  }
  const nodeEnv = fetchConfigMapValue('NODE_ENV')
  const psqlDbUrl = fetchConfigMapValue('PSQL_URL')
  const duelnowPsqlUrl = pulumi
    .all([psql.username, psql.password, psqlDbUrl, psql.name])
    .apply(([user, password, url, name]) => `postgresql://${user}:${password}@${url}/${name}`)

  // Create a Kubernetes Deployment using the image from the GitHub Container Registry.
  createK8sDeployment({
    name: imageName,
    env: [
      generateEnvVar('AWS_REGION'),
      generateEnvVar('LOG_LEVEL'),
      generateEnvVar('LOGZIO_TOKEN'),
      generateEnvVar('REDIS_URL', 'KAFKA_REDIS_URL'),
      {
        name: 'LAST_RESTART',
        value: restart ? new Date().toUTCString() : lastRestart, // restart deployment in case of code change
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
        name: 'ENABLE_SWAGGER',
        value: enableSwaggerValue,
      },
      {
        name: 'KAFKA_BROKER_URLS',
        value: kafkaUrl,
      },
      {
        name: 'NODE_ENV',
        value: nodeEnv,
      },
      {
        name: 'PORT',
        value: ports.sportsApi.toString(), // needs to be string in env
      },
    ],
    port: ports.sportsApi,
  })
})

// Call the createIngress functions
export const sportsApi = createK8sService({
  name: imageName,
  backendNamespace: backendNamespace,
  port: ports.sportsApi,
  type: 'ClusterIP',
})
