import { Logger, correlationIdMiddleware, getLogger } from '@duelnow/logger'

const namespace = 'sports-worker'
const logger: Logger = getLogger(namespace)

export { correlationIdMiddleware, logger }
