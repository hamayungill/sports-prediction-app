import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import {
  K8sDeploymentConfig,
  K8sServiceConfig,
  isProduction,
  k8sProvider,
  backendNamespace,
  sslCertArn,
  googleAppCreds,
} from './utils/config'
import { github } from './utils/const'

// Define the JSON content you want to add to the pod.
const jsonData = `{
  "key": "value"
}`
// Create a ConfigMap with the JSON file content.
const googleCreds = new k8s.core.v1.ConfigMap(
  'google-creds',
  {
    metadata: {
      namespace: backendNamespace,
    },
    data: {
      'firebase-duelnow.json': googleAppCreds,
    },
  },
  { provider: k8sProvider },
)

// Create a Kubernetes Secret
export function createImagePullSecret(name: string): k8s.core.v1.Secret {
  return new k8s.core.v1.Secret(
    name,
    {
      type: 'kubernetes.io/dockerconfigjson',
      metadata: {
        name: `ghcr-image-pull-secret-${name}`,
        namespace: backendNamespace,
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
          namespace: backendNamespace,
        },
        spec: {
          selector: {
            matchLabels: {
              app: name,
            },
          },
          replicas: isProduction ? 2 : 1,
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
                  volumeMounts:
                    name === 'account-api'
                      ? [
                        {
                          name: 'google-volume',
                          mountPath: '/tmp/',
                        },
                      ]
                      : [],
                  ports: [
                    {
                      containerPort: port,
                    },
                  ],
                  resources: {
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
                    httpGet: {
                      path: '/healthz',
                      port,
                    },
                  },
                },
              ],
              volumes:
                name === 'account-api'
                  ? [
                    {
                      name: 'google-volume',
                      configMap: {
                        name: googleCreds.metadata.name,
                      },
                    },
                  ]
                  : [],
            },
          },
        },
      },
      { provider: k8sProvider },
    )
  })
}

// Create a Kubernetes Services
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

// Function to create a Kubernetes Ingress
export function createIngress(imageName: string): k8s.networking.v1.Ingress {
  return new k8s.networking.v1.Ingress(
    imageName,
    {
      metadata: {
        name: imageName,
        namespace: backendNamespace,
        annotations: {
          'kubernetes.io/ingress.class': 'alb',
          'alb.ingress.kubernetes.io/scheme': 'internet-facing',
          'alb.ingress.kubernetes.io/listen-ports': '[{"HTTP": 80}, {"HTTPS":443}]',
          'alb.ingress.kubernetes.io/actions.ssl-redirect': '443',
          'alb.ingress.kubernetes.io/certificate-arn': sslCertArn,
          // Health check configuration
          'alb.ingress.kubernetes.io/healthcheck-protocol': 'HTTP',
          'alb.ingress.kubernetes.io/healthcheck-port': 'traffic-port',
          'alb.ingress.kubernetes.io/healthcheck-path': '/healthz',
          'alb.ingress.kubernetes.io/healthcheck-interval-seconds': '15',
          'alb.ingress.kubernetes.io/healthcheck-timeout-seconds': '5',
          'alb.ingress.kubernetes.io/success-codes': '200',
          'alb.ingress.kubernetes.io/healthy-threshold-count': '2',
          'alb.ingress.kubernetes.io/unhealthy-threshold-count': '2',
          // CORS Configuration
          'alb.ingress.kubernetes.io/cors-enabled': 'true',
          'alb.ingress.kubernetes.io/cors-allow-origin': 'http://localhost:3000',
          'alb.ingress.kubernetes.io/cors-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'alb.ingress.kubernetes.io/cors-allow-headers':
            'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type',
          'alb.ingress.kubernetes.io/cors-max-age': '3600',
        },
        labels: { app: imageName },
      },
      spec: {
        rules: [
          {
            http: {
              paths: [
                {
                  path: '/',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: imageName,
                      port: {
                        number: 80,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    { provider: k8sProvider },
  )
}
