import { Logger, correlationIdMiddleware, getLogger } from '@duelnow/logger'

const namespace = 'mixpanel-worker'
const logger: Logger = getLogger(namespace)

export { correlationIdMiddleware, logger }
