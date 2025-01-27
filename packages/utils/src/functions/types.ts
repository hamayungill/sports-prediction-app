// TODO: to be removed after v1 routes are deprecated
export interface ApiResponse {
  resCode: number
  resData: ResponsePayload
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ResponsePayload {
  code?: string
  data?: Record<string, any>
  message?: string
  pagination?: Record<any, any>
  status: string
}
