/* eslint-disable @typescript-eslint/no-explicit-any */

import { ErrorDetail, ErrorType, HttpResponseStatus } from '../consts'

import { ApiResponse } from '.'

export const apiResponse = (
  resCode: number,
  data?: Record<string, any>,
  pagination?: Record<any, any>,
): ApiResponse => {
  if (resCode === HttpResponseStatus.Ok || resCode === HttpResponseStatus.Created) {
    return {
      resCode,
      resData: {
        status: 'success',
        data,
        pagination,
      },
    }
  } else {
    return {
      resCode,
      resData: {
        status: 'fail',
        data,
        pagination,
      },
    }
  }
}

export const errorResponse = (errCode: ErrorType, resCode: number, data?: Record<string, any>): ApiResponse => {
  return {
    resCode,
    resData: {
      code: errCode,
      status: 'error',
      message: ErrorDetail[errCode],
      data,
    },
  }
}
