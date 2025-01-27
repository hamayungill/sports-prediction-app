import { Logger, correlationIdMiddleware, getLogger } from '@duelnow/logger'

const namespace = 'user-worker'
const logger: Logger = getLogger(namespace)

export { correlationIdMiddleware, logger }
