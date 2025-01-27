import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

interface Ports {
  exposedApi: number
  accountApi: number
  sportsApi: number
  sportsWorker: number
  mixpanelWorker: number
  cronWorker: number
  customerIoWorker: number
  eventWorker: number
  retryWorker: number
  questWorker: number
  alertWorker: number
}

interface Email {
  verifyCodeCache: string
  whitelistEmailDomain: string
}

interface CustomerIo {
  apiKey: string
  apiUrl: string
  appKey: string
  broadcastId: string
  broadcastUrl: string
  siteId: string
}

interface Psql {
  name: string
  password: string
  username: string
}

interface K8sDeploymentConfig {
  name: string
  env: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.EnvVar>[]>
  port: number
}

interface K8sServiceConfig {
  name: string
  backendNamespace: pulumi.Input<string>
  port: number
  type: string
}

interface SmartContract {
  admin: {
    privateKey: string
  }
  coinGeckoAPI: string
  coinGeckoAPIKey: string
}

interface MixPanel {
  projectToken: string
}

interface OpsGenieApiKeys {
  backend: string
  data: string
}

interface Infura {
  keyId: string
  privateKey: string
}

const config = new pulumi.Config()

// Project-level config
const ports = config.requireObject<Ports>('ports')
const email = config.requireObject<Email>('email')
const infraBaseStack = config.require('infraBaseStack')

// Stack-level config
const ipDataApi: string = config.require('ipDataApi')
const emailVerifyBaseUrl: string = config.require('emailVerifyBaseUrl')
const opsgenieApiKey = config.requireObject<OpsGenieApiKeys>('opsGenieApiKeys')
const psql = config.requireObject<Psql>('psql')
const customerIo = config.requireObject<CustomerIo>('customerIo')
const smartContract = config.requireObject<SmartContract>('smartContract')
const googleAppCreds = config.requireSecret('googleApiCreds')
const mixPanel = config.requireObject<MixPanel>('mixPanel')
const domains = config.require('domains')
const oddsApiOffset: string = config.require('oddsApiOffset')
const infura = config.requireObject<Infura>('infura')

// Base-stack config
const baseStack = new pulumi.StackReference(infraBaseStack)
const environment = baseStack.requireOutput('environment')
const isProduction = baseStack.requireOutput('isProduction')
const kafkaUrl = baseStack.requireOutput('kafkaBootstrapUrl')
const kubeconfig = baseStack.requireOutput('kubeconfig')
const backendNamespace = baseStack.requireOutput('backendNameSpace')
const backendConfigMap = baseStack.requireOutput('backendConfigMap')
const backendWorkerNamepace = baseStack.requireOutput('backendWorkerNameSpace')
const backendWorkerConfigMap = baseStack.requireOutput('backendWorkerConfigMap')
const sslCertArn = baseStack.requireOutput('sslCertificate')

const k8sProvider = new k8s.Provider('existing-default-k8s', {
  kubeconfig,
})

export {
  K8sDeploymentConfig,
  K8sServiceConfig,
  backendConfigMap,
  backendNamespace,
  backendWorkerConfigMap,
  backendWorkerNamepace,
  customerIo,
  domains,
  email,
  emailVerifyBaseUrl,
  environment,
  googleAppCreds,
  infura,
  ipDataApi,
  isProduction,
  k8sProvider,
  kafkaUrl,
  mixPanel,
  oddsApiOffset,
  opsgenieApiKey,
  ports,
  psql,
  smartContract,
  sslCertArn,
}
