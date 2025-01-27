import { parseUserAgent, stringifyHeaders } from './headers'

describe('parsedUserAgent function', () => {
  test('should return parsed user agent when given valid headers', () => {
    const headers = {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134',
    }
    const result = parseUserAgent(headers)
    expect(result).toHaveProperty('browser')
    expect(result).toHaveProperty('os')
  })

  test('should return empty object when headers are empty', () => {
    const headers = {}
    const result = parseUserAgent(headers)

    expect(result).toEqual({
      browser: { major: undefined, name: undefined, version: undefined },
      cpu: { architecture: undefined },
      device: { model: undefined, type: undefined, vendor: undefined },
      engine: { name: undefined, version: undefined },
      os: { name: undefined, version: undefined },
      ua: '',
    })
  })
})

describe('stringifyHeaders function', () => {
  test('should stringify all header values', () => {
    const headers = { key1: 123, key2: { nestedKey: 'value' } }
    stringifyHeaders(headers)
    expect(headers.key1).toBe('123')
    expect(headers.key2).toBe('[object Object]')
  })

  test('should not modify headers if all values are already strings', () => {
    const headers = { key1: 'value1', key2: 'value2' }
    stringifyHeaders(headers)

    expect(headers.key1).toBe('value1')
    expect(headers.key2).toBe('value2')
  })
})
