import { ApiResponseStatus } from '@duelnow/constants'

import { JsonObject, JsonValue } from './json'

// Error Response
export interface ErrorResponse {
  status: ApiResponseStatus.Error
  code: string
  message: string
  data?: JsonObject // Optional additional details about the error
}

// Fail Response
export interface FailResponse {
  status: ApiResponseStatus.Fail
  data: JsonObject
}

// Success Response
export interface SuccessResponse {
  status: ApiResponseStatus.Success
  data: JsonObject | null
  meta?: SuccessResponseMeta
}

export type SuccessResponseMeta = {
  nextCursor: string | null
  [key: string]: JsonValue // Allow additional meta fields
}
