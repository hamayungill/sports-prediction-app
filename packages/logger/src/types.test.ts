import { describe, expect, it } from '@jest/globals'

import { CustomHeaders } from './types'

describe('CustomHeaders Interface', () => {
  it('should allow empty objects', () => {
    const headers: CustomHeaders = {}
    expect(headers).toBeDefined()
  })

  it('should allow callerId and correlationId as optional properties', () => {
    const headers: CustomHeaders = {
      callerId: '12345',
      correlationId: 'abcde',
    }
    expect(headers.callerId).toBe('12345')
    expect(headers.correlationId).toBe('abcde')
  })

  it('should allow hyphenated keys as optional properties', () => {
    const headers: CustomHeaders = {
      'caller-id': '67890',
      'correlation-id': 'fghij',
    }
    expect(headers['caller-id']).toBe('67890')
    expect(headers['correlation-id']).toBe('fghij')
  })

  it('should support nested headers', () => {
    const headers: CustomHeaders = {
      headers: {
        callerId: '112233',
        'caller-id': '445566',
        correlationId: '778899',
        'correlation-id': '000111',
      },
    }
    expect(headers.headers?.callerId).toBe('112233')
    expect(headers.headers?.['caller-id']).toBe('445566')
    expect(headers.headers?.correlationId).toBe('778899')
    expect(headers.headers?.['correlation-id']).toBe('000111')
  })

  it('should allow combinations of keys', () => {
    const headers: CustomHeaders = {
      callerId: '001122',
      headers: {
        correlationId: '334455',
      },
    }
    expect(headers.callerId).toBe('001122')
    expect(headers.headers?.correlationId).toBe('334455')
  })
})
