import * as httpContext from 'express-http-context'
import { v4 as uuidv4 } from 'uuid'

import { CustomHeaders } from './types'

const extractCallerId = (data?: CustomHeaders): string | undefined => {
  return (
    (typeof data === 'object' &&
      (data?.callerId || data?.['caller-id'] || data?.headers?.callerId || data?.headers?.['caller-id'])) ||
    undefined
  )
}

const extractCorrelationId = (data?: CustomHeaders): string => {
  return (
    (typeof data === 'object' &&
      (data?.correlationId ||
        data?.['correlation-id'] ||
        data?.headers?.correlationId ||
        data?.headers?.['correlation-id'])) ||
    uuidv4()
  )
}

const getCorrelationId = (data?: CustomHeaders): string => {
  const correlationId = httpContext.get('correlationId') || extractCorrelationId(data)

  // Check if correlationId is a Buffer and convert it to a string
  if (Buffer.isBuffer(correlationId)) {
    return correlationId.toString('utf-8')
  }

  return correlationId
}

const getCallerId = (data?: CustomHeaders): string | undefined => {
  const callerId = httpContext.get('callerId') || extractCallerId(data)

  // Check if callerId is a Buffer and convert it to a string
  if (Buffer.isBuffer(callerId)) {
    return callerId.toString('utf-8')
  }

  return callerId
}

export { extractCallerId, extractCorrelationId, getCallerId, getCorrelationId }
