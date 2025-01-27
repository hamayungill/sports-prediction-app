import { Logger, correlationIdMiddleware, getLogger } from '@duelnow/logger'

const namespace = 'cron-worker'
const logger: Logger = getLogger(namespace)

export { correlationIdMiddleware, logger }
