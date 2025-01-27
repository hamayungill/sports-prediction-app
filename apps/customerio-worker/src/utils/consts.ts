import { customerioEnvs } from './envs'

// Custom configuration of type field in customerio api documentation link: https://customer.io/docs/api/track/#operation/entity
const TYPE = {
  PERSON: 'person',
  OBJECT: 'object',
  DELIVERY: 'delivery',
}

// Custom configuration of action field in customerio api documentation link: https://customer.io/docs/api/track/#operation/entity
const ACTION = {
  PAGE: 'page',
  EVENT: 'event',
  IDENTIFY: 'identify',
}

const CALLER = {
  ANONYMOUS: 'anonymous',
}

const CUSTOMERIO_ENPOINTS = {
  TRACK_AUTH_CUSTOMERIO: '/api/v2/entity',
  BROADCAST_CUSTOMERIO: `/v1/campaigns/${customerioEnvs.api.broadcastId}/triggers`,
}

const CUSTOMERIO = { ENDPOINTS: CUSTOMERIO_ENPOINTS, ...customerioEnvs }
export { ACTION, CALLER, CUSTOMERIO, TYPE }
