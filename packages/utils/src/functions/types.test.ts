import { ApiResponse, ResponsePayload } from './types'

describe('ApiResponse Interface', () => {
  it('should create a valid ApiResponse object', () => {
    const responsePayload: ResponsePayload = {
      status: 'success',
      data: { key: 'value' },
    }

    const apiResponse: ApiResponse = {
      resCode: 200,
      resData: responsePayload,
    }

    expect(apiResponse.resCode).toBe(200)
    expect(apiResponse.resData.status).toBe('success')
    expect(apiResponse.resData.data).toEqual({ key: 'value' })
  })

  it('should create a valid ApiResponse object with optional fields', () => {
    const responsePayload: ResponsePayload = {
      status: 'error',
      code: 'ERR001',
      message: 'An error occurred',
      data: { key: 'value' },
    }

    const apiResponse: ApiResponse = {
      resCode: 400,
      resData: responsePayload,
    }

    expect(apiResponse.resCode).toBe(400)
    expect(apiResponse.resData.status).toBe('error')
    expect(apiResponse.resData.code).toBe('ERR001')
    expect(apiResponse.resData.message).toBe('An error occurred')
    expect(apiResponse.resData.data).toEqual({ key: 'value' })
  })

  it('should allow pagination in the ApiResponse', () => {
    const responsePayload: ResponsePayload = {
      status: 'success',
      data: { key: 'value' },
      pagination: { page: 1, total: 10 },
    }

    const apiResponse: ApiResponse = {
      resCode: 200,
      resData: responsePayload,
    }

    expect(apiResponse.resData.pagination).toEqual({ page: 1, total: 10 })
  })

  it('should fail if required fields are missing', () => {
    // @ts-expect-error - Testing for TypeScript error when `status` is missing
    const responsePayload: ResponsePayload = {
      data: { key: 'value' },
    }

    expect(responsePayload.data).toEqual({ key: 'value' })
  })

  it('should allow different types of data in ResponsePayload', () => {
    const responsePayload: ResponsePayload = {
      status: 'success',
      data: { stringKey: 'value', numberKey: 123, booleanKey: true },
    }

    const apiResponse: ApiResponse = {
      resCode: 200,
      resData: responsePayload,
    }

    expect(apiResponse.resData.data).toEqual({
      stringKey: 'value',
      numberKey: 123,
      booleanKey: true,
    })
  })
})
