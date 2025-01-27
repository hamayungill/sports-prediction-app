import { Logger, correlationIdMiddleware, getLogger } from '@duelnow/logger'

const namespace = 'quest-worker'
const logger: Logger = getLogger(namespace)

export { correlationIdMiddleware, logger }
