// eslint-disable-next-line import/no-unresolved
import { NextFunction, Request, Response } from 'express'
import * as httpContext from 'express-http-context'

import { CustomHeaders } from './types'
import { extractCallerId, extractCorrelationId } from './utils'

// `req` can be Request or CustomHeaders to make linting works for both HTTP requests and Kafka message headers
const correlationIdMiddleware = (req: Request | CustomHeaders, res: Response | null, next: NextFunction): void => {
  try {
    httpContext.middleware(req as Request, res as Response, () => {
      httpContext.set('correlationId', extractCorrelationId(req as CustomHeaders))
      httpContext.set('callerId', extractCallerId(req as CustomHeaders))
      next()
    })
  } catch (err) {
    next(err)
  }
}

export default correlationIdMiddleware
