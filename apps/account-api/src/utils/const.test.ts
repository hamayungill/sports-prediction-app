/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable turbo/no-undeclared-env-vars */

describe('Environment Variables', () => {
  beforeEach(() => {
    jest.resetModules() // Clears any previous env variable values
  })

  it('should correctly export the environment variables', () => {
    // Setting the environment variables
    process.env.ENABLE_SWAGGER = 'true'
    process.env.PORT = '3000'
    process.env.EMAIL_VERIFY_BASE_URL = 'http://example.com/verify'
    process.env.EMAIL_VERIFY_CODE_CACHE_TTL = '900'
    process.env.NODE_ENV = 'production'
    process.env.PRE_REGISTERED_NICKNAMES = 'admin,root,user'
    process.env.WHITELIST_EMAIL_DOMAIN = 'example.com'

    // Re-import the module to apply the new env vars
    const {
      EMAIL_VERIFY_BASE_URL: URL,
      EMAIL_VERIFY_CODE_CACHE_TTL: TTL,
      ENABLE_SWAGGER: SwaggerEnabled,
      PORT: ServerPort,
      WHITELIST_EMAIL_DOMAIN: EmailDomain,
      environment: Env,
      preRegisteredNicknames: Nicknames,
    } = require('./const')

    expect(URL).toBe('http://example.com/verify')
    expect(TTL).toBe('900')
    expect(SwaggerEnabled).toBe('true')
    expect(ServerPort).toBe('3000')
    expect(EmailDomain).toBe('example.com')
    expect(Env).toBe('production')
    expect(Nicknames).toEqual(['admin', 'root', 'user'])
  })

  it('should default EMAIL_VERIFY_CODE_CACHE_TTL to 600 when not set', () => {
    delete process.env.EMAIL_VERIFY_CODE_CACHE_TTL

    const { EMAIL_VERIFY_CODE_CACHE_TTL: TTL } = require('./const')

    expect(TTL).toBe('600')
  })

  it('should return an empty array for preRegisteredNicknames if PRE_REGISTERED_NICKNAMES is not set', () => {
    delete process.env.PRE_REGISTERED_NICKNAMES

    const { preRegisteredNicknames: Nicknames } = require('./const')

    expect(Nicknames).toEqual([])
  })

  it('should split PRE_REGISTERED_NICKNAMES by comma', () => {
    process.env.PRE_REGISTERED_NICKNAMES = 'admin,root,user'

    const { preRegisteredNicknames: Nicknames } = require('./const')

    expect(Nicknames).toEqual(['admin', 'root', 'user'])
  })
})
