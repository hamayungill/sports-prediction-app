/* eslint-disable  @typescript-eslint/no-explicit-any */
import { correlationIdMiddleware, getCallerId, getCorrelationId } from './index'

const newObj: any = {}

jest.mock('express-http-context', (): object => ({
  set: (name: string, value: string): undefined => {
    newObj[name] = value
  },
  get: (name: string): string | undefined => {
    return newObj[name]
  },
  middleware: jest.fn,
}))

describe('Logeer index.ts', () => {
  test('getUserId Should get userId', () => {
    const input = {
      callerId: 'abcd-123-ancn-456',
    }
    const accId = getCallerId(input)
    expect(accId).toEqual(input.callerId)
  })

  test('getCorrelationId Should get correlationId', () => {
    const reqObj = {
      headers: {
        callerId: 'abcd-123-ancn-456',
        correlationId: '3be3c89f-c8f6-4f66-99cc-a5401cdb26a6',
      },
    }
    correlationIdMiddleware(reqObj, null, () => {
      const correlationId = getCorrelationId(reqObj)
      expect(correlationId).toBe(reqObj.headers.correlationId)
    })
  })
})
