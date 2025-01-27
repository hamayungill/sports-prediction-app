import * as dotenvExtended from 'dotenv-extended'

dotenvExtended.load({
  path: `.env${process.env.GITHUB_ACTIONS ? '.example' : ''}`,
  errorOnMissing: true,
  includeProcessEnv: true,
})

const env = process.env
export const {
  ARBITRUM_API_URL: arbitrumApiUrl,
  ARBITRUM_WS_URL: arbitrumWebSocketUrl,
  ETHEREUM_API_URL: ethereumApiUrl,
  ETHEREUM_WS_URL: ethereumWebSocketUrl,
  INFURA_API_KEY: infuraApiKey,
  INFURA_JWT_KEY_ID: infuraJwtKeyId,
  INFURA_JWT_PRIVATE_KEY: infuraJwtPrivateKey,
  SC_ADMIN_PRIVATE_KEY: scAdminPrivateKey,
} = env
