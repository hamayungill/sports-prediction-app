import { CustomHeaders, Logger, correlationIdMiddleware, getLogger } from '@duelnow/logger'

const namespace = 'axios-extended'
const logger: Logger = getLogger(namespace)

export type { CustomHeaders }

export { correlationIdMiddleware, logger }
