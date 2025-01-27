import { NextFunction, Request, Response } from 'express'

import { DOMAINS } from './const'

const domainsList = DOMAINS?.split(',') as string[]

export function restrictDomain(req: Request, res: Response, next: NextFunction): void {
  const allowedDomains: string[] = domainsList
  const requestDomain = req.hostname // Get the hostname from the request

  if (allowedDomains.includes(requestDomain)) {
    next() // Allow the request to proceed to the next middleware or route
  } else {
    res.status(403).json({ error: 'Access Forbidden' }) // Return a 403 Forbidden error
  }
}
