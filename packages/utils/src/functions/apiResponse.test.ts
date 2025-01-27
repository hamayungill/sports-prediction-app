import { apiResponse, errorResponse } from './apiResponses'
import { ErrorDetail, ErrorType, HttpResponseStatus } from '../consts'

import { ApiResponse } from '.'

describe('apiResponse', () => {
  it('should return a success response with data and pagination for status OK', () => {
    const data = { key: 'value' }
    const pagination = { page: 1, limit: 10 }
    const response = apiResponse(HttpResponseStatus.Ok, data, pagination)

    const expectedResponse: ApiResponse = {
      resCode: HttpResponseStatus.Ok,
      resData: {
        status: 'success',
        data,
        pagination,
      },
    }

    expect(response).toEqual(expectedResponse)
  })

  it('should return a success response without data and pagination for status CREATED', () => {
    const response = apiResponse(HttpResponseStatus.Created)

    const expectedResponse: ApiResponse = {
      resCode: HttpResponseStatus.Created,
      resData: {
        status: 'success',
        data: undefined,
        pagination: undefined,
      },
    }

    expect(response).toEqual(expectedResponse)
  })

  it('should return a fail response with data and pagination for non-OK/CREATED status', () => {
    const data = { error: 'Invalid request' }
    const pagination = { page: 1, limit: 10 }
    const response = apiResponse(400, data, pagination)

    const expectedResponse: ApiResponse = {
      resCode: 400,
      resData: {
        status: 'fail',
        data,
        pagination,
      },
    }

    expect(response).toEqual(expectedResponse)
  })

  it('should return a fail response without data and pagination for non-OK/CREATED status', () => {
    const response = apiResponse(400)

    const expectedResponse: ApiResponse = {
      resCode: 400,
      resData: {
        status: 'fail',
        data: undefined,
        pagination: undefined,
      },
    }

    expect(response).toEqual(expectedResponse)
  })
})

describe('errorResponse', () => {
  it('should return an error response with code, status, message, and data', () => {
    const data = { error: 'Not Found' }
    const response = errorResponse(ErrorType.BadRequest, 404, data)

    const expectedResponse: ApiResponse = {
      resCode: 404,
      resData: {
        code: ErrorType.BadRequest,
        status: 'error',
        message: ErrorDetail[ErrorType.BadRequest],
        data,
      },
    }

    expect(response).toEqual(expectedResponse)
  })

  it('should return an error response without data', () => {
    const response = errorResponse(ErrorType.BadRequest, 400)

    const expectedResponse: ApiResponse = {
      resCode: 400,
      resData: {
        code: ErrorType.BadRequest,
        status: 'error',
        message: ErrorDetail[ErrorType.BadRequest],
        data: undefined,
      },
    }

    expect(response).toEqual(expectedResponse)
  })
})
