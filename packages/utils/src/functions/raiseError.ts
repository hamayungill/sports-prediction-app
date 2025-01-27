import { FatalError, RetriableError } from './customErrors'

export const raiseError = (errorCode: number, errorDetails: string | object): void | undefined => {
  if (typeof errorDetails === 'object') {
    throw new Object({ errorCode, ...errorDetails })
  } else {
    if (errorCode === 400 || errorCode === 408) {
      throw new RetriableError(`Error code: ${errorCode}, Error detail: ${errorDetails}}`)
    }
    if ((errorCode >= 401 && errorCode < 408) || errorCode >= 500) {
      throw new FatalError(`Error code: ${errorCode}, Error detail: ${errorDetails}`)
    }
  }
}
