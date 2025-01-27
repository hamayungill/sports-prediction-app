import { ApiResponseStatus } from '@duelnow/constants'
import { ErrorResponse, FailResponse, JsonObject, SuccessResponse, SuccessResponseMeta } from '@duelnow/types'

export const sendError = (code: string, message: string, data?: JsonObject): ErrorResponse => {
  return {
    status: ApiResponseStatus.Error,
    code,
    message,
    data,
  }
}

export const sendFail = (data: JsonObject): FailResponse => {
  return {
    status: ApiResponseStatus.Fail,
    data,
  }
}

export const sendSuccess = (data: JsonObject | null, meta?: SuccessResponseMeta): SuccessResponse => {
  return {
    status: ApiResponseStatus.Success,
    data,
    meta,
  }
}
