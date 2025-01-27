import { Logger, correlationIdMiddleware, getLogger } from '@duelnow/logger'

const namespace = 'ip-info'
const logger: Logger = getLogger(namespace)

export { correlationIdMiddleware, logger }
