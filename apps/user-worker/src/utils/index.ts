import { envs } from './const'
import { producer } from './kafkaProducer'
import { correlationIdMiddleware, logger } from './logger'

const { KAFKA_BROKER_URLS } = envs

export { KAFKA_BROKER_URLS, correlationIdMiddleware, logger, producer }
