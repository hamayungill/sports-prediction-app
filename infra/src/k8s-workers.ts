import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import { K8sDeploymentConfig, K8sServiceConfig, isProduction, k8sProvider, backendWorkerNamepace } from './utils/config'
import { github } from './utils/const'

// Create a Kubernetes Secret
export function createImagePullSecret(name: string): k8s.core.v1.Secret {
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
                username,
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

// Create a Kubernetes Deployment
export const createK8sDeployment = (config: K8sDeploymentConfig): void => {
  const { name, env, port } = config
  isProduction.apply((isProduction: boolean) => {
    const tag = isProduction ? 'release' : 'latest'
    console.log('value of isProduction', isProduction)
    const imageUri = `ghcr.io/${github.orgName}/${name}:${tag}`
    const imagePullSecret = createImagePullSecret(name)
    new k8s.apps.v1.Deployment(
      name,
      {
        metadata: {
          name,
          namespace: backendWorkerNamepace,
        },
        spec: {
          selector: {
            matchLabels: {
              app: name,
            },
          },
          replicas: name === 'sports-worker' ? 2 : 1,
          template: {
            metadata: {
              labels: {
                app: name,
              },
            },
            spec: {
              imagePullSecrets: [
                {
                  name: imagePullSecret.metadata.name,
                },
              ],
              containers: [
                {
                  env,
                  name,
                  image: imageUri,
                  imagePullPolicy: 'Always',
                  ports: [
                    {
                      containerPort: port,
                    },
                  ],
                  //TODO: sports-worker and customerio-worker having memory issue. Temp fix 
                  resources:
                    name === 'customerio-worker'
                      ? {}
                      : {
                        limits: {
                          cpu: '250m',
                          memory: '450Mi',
                        },
                        requests: {
                          cpu: '200m',
                          memory: '400Mi',
                        },
                      },
                  readinessProbe: {
                    exec: {
                      command: ['cat', '/app/healthy'],
                    },
                  },
                },
              ],
            },
          },
        },
      },
      { provider: k8sProvider },
    )
  })
}

// Create a Kubernetes Service
export const createK8sService = (config: K8sServiceConfig): k8s.core.v1.Service => {
  const { name, backendNamespace, port, type } = config

  return new k8s.core.v1.Service(
    name,
    {
      metadata: {
        name,
        namespace: backendNamespace,
      },
      spec: {
        type,
        ports: [
          {
            port: 80,
            targetPort: port,
            protocol: 'TCP',
          },
        ],
        selector: { app: name },
      },
    },
    { provider: k8sProvider },
  )
}
