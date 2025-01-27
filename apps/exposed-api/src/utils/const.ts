// eslint-disable-next-line turbo/no-undeclared-env-vars
const { ACCOUNT_API_URL, ENABLE_SWAGGER, PORT, SPORTS_API_URL, KAFKA_BROKERS_URL, DUELNOW_DOMAINS } = process.env

export { ACCOUNT_API_URL, ENABLE_SWAGGER, PORT, SPORTS_API_URL }

export const enum AuthType {
  Email = 'email',
  Social = 'social',
  Wallet = 'wallet',
}

export const DOMAINS = DUELNOW_DOMAINS

export const JWKS_URLS = {
  SOCIAL: 'https://api-auth.web3auth.io/jwks',
  CUSTOM_WALLET: 'https://authjs.web3auth.io/jwks',
}

export const KAFKA = {
  BROKERS: KAFKA_BROKERS_URL,
  TOPICS: {
    TRACKING_USER_EVENTS: 'tracking.user.events',
  },
}
