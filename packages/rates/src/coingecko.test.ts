import { getRates } from './index'

let resolved: number

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('axios', () => {
  return {
    create: jest.fn().mockImplementation(() => {
      return {
        defaults: {
          headers: {
            common: {},
          },
        },
        interceptors: {
          request: {
            use: jest.fn(),
          },
          response: {
            use: jest.fn(),
          },
        },
        get: jest.fn(() => {
          /* eslint-disable prettier/prettier */
          return resolved === 1 || resolved === 2
            ? Promise.resolve({
              data: {
                ethereum: { usd: 2 },
                storm: { usd: 2 },
                bitcoin: { usd: 2 },
                'usd-coin': { usd: 2 },
                tether: { usd: 2 },
                arb: { usd: 2 },
              },
            })
            : resolved == 3
              ? Promise.resolve({ data: null })
              : Promise.reject(new Error('dummy error'))
          /* eslint-enable prettier/prettier */
        }),
      }
    }),
  }
})

jest.mock('@duelnow/logger', () => ({
  Logger: jest.fn(),
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  getLogger: jest.fn(),
}))

jest.mock('./utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  correlationIdMiddleware: jest.fn(),
}))

jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      connect: jest.fn(),
      get: jest.fn().mockImplementation(() => {
        return resolved === 1 ? 2 : null
      }),
      del: jest.fn().mockImplementation(() => {
        return Promise.resolve('')
      }),
      set: jest.fn().mockImplementation(() => {
        return Promise.resolve('')
      }),
    }
  }),
}))

describe('Coingecko getRates Method', () => {
  it('should return correct values for different tokens', async () => {
    resolved = 1
    expect(await getRates(['eth'])).toEqual([{ token: 'eth', usdPrice: 2 }])

    resolved = 2
    expect(await getRates(['eth'])).toEqual([{ token: 'eth', usdPrice: 2 }])

    expect(await getRates(['bitcoin'])).toEqual([{ token: 'bitcoin', usdPrice: 2 }])
  })

  it('should return correct values even with case-insensitive tokens names', async () => {
    resolved = 2
    expect(await getRates(['ETh'])).toEqual([{ token: 'eth', usdPrice: 2 }])

    expect(await getRates(['USdt'])).toEqual([{ token: 'usdt', usdPrice: 2 }])

    expect(await getRates(['USDC'])).toEqual([{ token: 'usdc', usdPrice: 2 }])

    expect(await getRates(['USDC'])).toEqual([{ token: 'usdc', usdPrice: 2 }])
  })

  test('should fail', async () => {
    resolved = 4
    await getRates(['eth'])
  })
})
