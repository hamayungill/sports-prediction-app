/* eslint-disable @typescript-eslint/no-explicit-any */
import os from 'os'

import { systemIp } from './consts'
import { bufferToString, delay, generateCode, getSystemIp, isLocal, transformKeys } from './helper'

describe('bufferToString', () => {
  it('should convert a valid JSON buffer to a string', () => {
    const bufferData = Buffer.from(JSON.stringify({ key: 'value' }))
    const result = bufferToString(bufferData)
    expect(result).toEqual({ key: 'value' })
  })

  it('should throw an error for an invalid JSON buffer', () => {
    const bufferData = Buffer.from('invalid json')
    expect(() => bufferToString(bufferData)).toThrow('Invalid JSON in buffer data')
  })

  it('should return the input data if it is not a buffer', () => {
    const data = { key: 'value' }
    const result = bufferToString(data)
    expect(result).toEqual(data)
  })
})

describe('delay', () => {
  jest.useFakeTimers()

  it('should delay execution for the specified time', async () => {
    const ms = 1000
    const promise = delay(ms)

    jest.advanceTimersByTime(ms)

    await expect(promise).resolves.toBeUndefined()
  })
})

describe('generateCode', () => {
  it('should generate a code of the specified length', () => {
    const length = 10
    const code = generateCode(length)
    expect(code).toHaveLength(length)
  })

  it('should generate a code containing only valid characters', () => {
    const length = 10
    const code = generateCode(length)
    const validCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
      expect(validCharacters).toContain(code[i])
    }
  })
})

describe('getSystemIp', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return the IP address from the system network interfaces', () => {
    const mockIp = '127.0.0.1'
    jest.spyOn(os, 'networkInterfaces').mockReturnValue({
      lo0: [{ address: mockIp }],
    } as any)

    const ipAddress = getSystemIp()
    expect(ipAddress).toBe(mockIp)
  })

  it('should return the fallback IP from systemIp if no IP address is found', () => {
    jest.spyOn(os, 'networkInterfaces').mockReturnValue({})
    const ipAddress = getSystemIp()
    if (systemIp) expect(ipAddress).toBe(systemIp)
    else expect(ipAddress).toBe('')
  })
})

describe('isLocal', () => {
  it('should return true if NODE_ENV is set to "local"', () => {
    process.env.NODE_ENV = 'local'
    expect(isLocal()).toBe(true)
  })

  it('should return false if NODE_ENV is not set to "local"', () => {
    process.env.NODE_ENV = 'production'
    expect(isLocal()).toBe(false)

    process.env.NODE_ENV = 'test'
    expect(isLocal()).toBe(false)
  })

  afterAll(() => {
    delete process.env.NODE_ENV // Clean up after tests
  })
})

describe('transformKeys', () => {
  it('should transform object keys from camelCase to snake_case', () => {
    const obj = { camelCaseKey: 'value', nestedObject: { nestedKey: 'nestedValue' } }
    const expectedObj = { camel_case_key: 'value', nested_object: { nested_key: 'nestedValue' } }
    const transformedObj = transformKeys(obj)
    expect(transformedObj).toEqual(expectedObj)
  })

  it('should transform array of objects with camelCase keys to snake_case', () => {
    const array = [{ camelCaseKey: 'value1' }, { anotherCamelCaseKey: 'value2' }]
    const expectedArray = [{ camel_case_key: 'value1' }, { another_camel_case_key: 'value2' }]
    const transformedArray = transformKeys(array)
    expect(transformedArray).toEqual(expectedArray)
  })

  it('should return non-object, non-array values as-is', () => {
    const value = 'string'
    const transformedValue = transformKeys(value)
    expect(transformedValue).toBe(value)
  })

  it('should return null as-is', () => {
    const value = null
    const transformedValue = transformKeys(value)
    expect(transformedValue).toBeNull()
  })
})
