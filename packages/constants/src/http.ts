export enum ApiResponseStatus {
  Success = 'success',
  Fail = 'fail',
  Error = 'error',
}

export enum CallerType {
  Anonymous = 'anonymous',
  User = 'user',
}

export const HTTP_RESPONSE_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_CONTENT: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const
