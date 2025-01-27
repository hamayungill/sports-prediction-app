import { Logger as WinstonLogger } from 'winston'

import correlationIdMiddleware from './correlationIdMiddleware'
import Logger, { getLogger } from './logger'
import morganMiddleware from './morganMiddleware'
import { CustomHeaders } from './types'
import { getCallerId, getCorrelationId } from './utils'

export type { CustomHeaders }

export { Logger, WinstonLogger, correlationIdMiddleware, getCallerId, getCorrelationId, getLogger, morganMiddleware }
