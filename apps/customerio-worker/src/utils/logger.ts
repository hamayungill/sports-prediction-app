import { Logger, correlationIdMiddleware, getLogger } from '@duelnow/logger'

const namespace = 'customerio-worker'
const logger: Logger = getLogger(namespace)

export { correlationIdMiddleware, logger }
