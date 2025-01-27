import { Logger, correlationIdMiddleware, getLogger } from '@duelnow/logger'

const namespace = 'retry-worker'
const logger: Logger = getLogger(namespace)

export { correlationIdMiddleware, logger }
