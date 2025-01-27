import { raiseError } from './index'

jest.mock('dotenv-extended', () => {
  return { load: (params: unknown): unknown => params }
})

describe('Test raiseError function', () => {
  test('Success! call RetriableError method to format the error', () => {
    const input = {
      code: 400,
      message: 'Test error from RetriableError',
    }
    expect(() => {
      raiseError(input.code, input.message)
    }).toThrow('Error code: 400, Error detail: Test error from RetriableError')
  })

  test('Success! call RetriableError method to format the error', () => {
    const input = {
      code: 400,
      data: { message: 'Test error from RetriableError' },
    }
    expect(() => {
      raiseError(input.code, input.data)
    }).toThrow(input.data.message)
  })

  test('Success! call FatalError method to format the error', () => {
    const input = {
      code: 401,
      message: 'Test error from FatalError',
    }
    expect(() => {
      raiseError(input.code, input.message)
    }).toThrow('Error code: 401, Error detail: Test error from FatalError')
  })

  test('Not to throw any error when code is 200', () => {
    const input = {
      code: 200,
      message: '',
    }
    expect(() => {
      raiseError(input.code, input.message)
    }).not.toThrow()
  })
})
