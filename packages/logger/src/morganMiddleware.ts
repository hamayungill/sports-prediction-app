/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import { Handler } from 'express'
import morgan from 'morgan'

import Logger from './logger'

// The morgan middleware
export default (logger: Logger): Handler => {
  return morgan(
    (tokens, req, res) => {
      // Stringify the log object to pass it as a string to the stream
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: tokens.status(req, res),
        responseTime: `${tokens['response-time'](req, res) || '0'} ms`,
      })
    },
    {
      stream: {
        write: (message) => {
          logger.http(message.trim())
        },
      },
      skip: (req, res) => {
        // Skip logging for all /healthz routes
        return req.url.startsWith('/healthz')
      },
    },
  )
}
