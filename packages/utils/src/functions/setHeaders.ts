import { getCorrelationId } from '@duelnow/logger'
import { NextFunction, Request, Response } from 'express'

const setHeaders = (req: Request, res: Response, next: NextFunction): undefined => {
  const correlationId = getCorrelationId()
  const headers = { ...req.headers, 'correlation-id': correlationId, 'Cache-Control': 'no-cache' }
  req.headers = headers
  res.set('correlation-id', correlationId)

  next()
}
export default setHeaders
