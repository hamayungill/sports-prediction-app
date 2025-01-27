import { ERROR_CODES, HTTP_RESPONSE_STATUS } from '@duelnow/constants'
import { sendError, sendFail, setHeaders } from '@duelnow/utils'
import cors from 'cors'
import express, { Express, NextFunction, Request, Response, json, urlencoded } from 'express'
import { generateHTML, serve } from 'swagger-ui-express'
import { ValidateError } from 'tsoa'

import { getIp } from './middleware/getIp'
import { RegisterRoutes } from './routes/routes'
import swaggerJson from './swagger/swagger.json'
import { ENABLE_SWAGGER, PORT } from './utils/const'
import { correlationIdMiddleware, logger, morganMiddleware } from './utils/logger'

const { UNPROCESSABLE_CONTENT, NOT_FOUND, INTERNAL_SERVER_ERROR } = HTTP_RESPONSE_STATUS
const { SOMETHING_WENT_WRONG } = ERROR_CODES.MISC

const app: Express = express()

app.use(json({ limit: '10mb' }))
app.use(urlencoded({ extended: true, limit: '10mb' }))
app.use(cors())
app.use(correlationIdMiddleware)
app.use(morganMiddleware)
app.use(getIp) // this must be positioned after the correlationId middleware to ensure the correlation ID appears in the logs
app.use(setHeaders)

RegisterRoutes(app)

// any error handler middleware should come after RegisterRoutes
app.use(async (err: unknown, req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  logger.error('exposed-api app.ts error', err)

  if (err instanceof ValidateError) {
    logger.warn(`Caught Validation Error for ${req.path}:`, err.fields)
    return res.status(UNPROCESSABLE_CONTENT).json(
      sendFail({
        message: 'Validation Failed',
        details: err?.fields,
      }),
    )
  }

  if (err instanceof Error) {
    return res
      .status(INTERNAL_SERVER_ERROR)
      .json(sendError(SOMETHING_WENT_WRONG.CODE, SOMETHING_WENT_WRONG.MESSAGE, { detail: err.message }))
  }

  next()
})

if (ENABLE_SWAGGER && ENABLE_SWAGGER === 'true') {
  app.use('/docs', serve, async (_: Request, res: Response) => {
    return res.send(generateHTML(swaggerJson))
  })
}

app.get('/healthz', (_, res) => {
  res.send('Exposed API is running...')
})

// Catch all unmatched routes and return 404
app.use((_req: Request, res: Response) => {
  res.status(NOT_FOUND).json(sendFail({ message: 'Route not found' }))
})

const startServer = (): undefined => {
  const server = app.listen(PORT, () => {
    logger.info(`exposed-api started on port ${PORT}`)
  })
  server.on('error', (e) => logger.error(`exposed-api failed to start with error`, e))
}

export { app, startServer }
