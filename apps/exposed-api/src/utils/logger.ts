import { Logger, correlationIdMiddleware, getLogger, morganMiddleware as mgMiddleware } from '@duelnow/logger'

const namespace = 'exposed-api'
const logger: Logger = getLogger(namespace)
const morganMiddleware = mgMiddleware(logger)

export { correlationIdMiddleware, logger, morganMiddleware }
