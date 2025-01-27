import { extractCallerId, extractCorrelationId, getCallerId } from './utils'

describe('Verify utils functions', () => {
  test('extractUserId Should get userId', () => {
    const input = {
      callerId: 'abcd-123-ancn-456',
      headers: { callerId: 'abcd-123-ancn-456' },
    }
    const accIdI = extractCallerId({ callerId: input.callerId })
    const accIdIH = extractCallerId({ headers: { ...input.headers } })
    const accIdUndefined = extractCallerId()
    expect(accIdI).toEqual(input.callerId)
    expect(accIdIH).toEqual(input.headers.callerId)
    expect(accIdUndefined).toEqual(undefined)
  })

  test('extractCorrelationId Should get correlationId', () => {
    const input = {
      correlationId: '3be3c89f-c8f6-4f66-99cc-a5401cdb26a6',
    }
    const accId = extractCorrelationId(input)
    expect(accId).toEqual(input.correlationId)
  })

  test('getUserId Should get userId', () => {
    const input = {
      callerId: 'abcd-123-ancn-456',
    }
    const accId = getCallerId(input)
    expect(accId).toEqual(input.callerId)
  })
})
