import {
  EMAIL_VERIFY_BASE_URL,
  EMAIL_VERIFY_CODE_CACHE_TTL,
  ENABLE_SWAGGER,
  PORT,
  WHITELIST_EMAIL_DOMAIN,
  environment,
  preRegisteredNicknames,
} from './const'
import { producer } from './kafkaProducer'
import { correlationIdMiddleware, logger, morganMiddleware } from './logger'
import { isValidNickname, getUniqueNickname as nickname } from './nickname'
import * as Types from './types'

export {
  EMAIL_VERIFY_BASE_URL,
  EMAIL_VERIFY_CODE_CACHE_TTL,
  ENABLE_SWAGGER,
  PORT,
  Types,
  WHITELIST_EMAIL_DOMAIN,
  correlationIdMiddleware,
  environment,
  isValidNickname,
  logger,
  morganMiddleware,
  nickname,
  preRegisteredNicknames,
  producer,
}
