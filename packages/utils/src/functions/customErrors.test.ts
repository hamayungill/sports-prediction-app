import { FatalError, NonRetriableError, RetriableError } from './customErrors'

describe('Error Formatter', () => {
  it('should validate the accurate generation of fatal error', () => {
    const message = `Test Error Message`
    const errorMsg = new FatalError(message)
    expect(errorMsg.message).toBe(message)
    expect(errorMsg.name).toBe('FatalError')
  })

  it('should validate the accurate generation of non-retriable error', () => {
    const message = `Test Error Message`
    const errorMsg = new NonRetriableError(message)
    expect(errorMsg.message).toBe(message)
    expect(errorMsg.name).toBe('NonRetriableError')
  })

  it('should validate the accurate generation of retriable error', () => {
    const message = `Test Error Message`
    const errorMsg = new RetriableError(message)
    expect(errorMsg.message).toBe(message)
    expect(errorMsg.name).toBe('RetriableError')
  })
})
