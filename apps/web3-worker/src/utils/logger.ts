import { Logger, correlationIdMiddleware, getLogger } from '@duelnow/logger'

const namespace = 'web3-worker'
const logger: Logger = getLogger(namespace)

export { correlationIdMiddleware, logger }
