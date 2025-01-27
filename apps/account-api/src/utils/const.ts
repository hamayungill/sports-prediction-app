// eslint-disable-next-line turbo/no-undeclared-env-vars
const {
  ENABLE_SWAGGER,
  PORT,
  EMAIL_VERIFY_BASE_URL,
  EMAIL_VERIFY_CODE_CACHE_TTL = '600',
  NODE_ENV: environment,
  PRE_REGISTERED_NICKNAMES,
  WHITELIST_EMAIL_DOMAIN,
} = process.env

const preRegisteredNicknames = PRE_REGISTERED_NICKNAMES?.split(',') || []

export {
  EMAIL_VERIFY_BASE_URL,
  EMAIL_VERIFY_CODE_CACHE_TTL,
  ENABLE_SWAGGER,
  PORT,
  WHITELIST_EMAIL_DOMAIN,
  environment,
  preRegisteredNicknames,
}
