import { ApiResponse, setHeaders } from '@duelnow/utils'
import { createMerkleTree } from '@duelnow/web3'
import express, { Express, NextFunction, Request, Response, json, urlencoded } from 'express'
import { generateHTML, serve } from 'swagger-ui-express'

import { RegisterRoutes } from './routes/routes'
import swaggerJson from './swagger/swagger.json'
import { ENABLE_SWAGGER, PORT, correlationIdMiddleware, logger, morganMiddleware } from './utils'

const app: Express = express()

app.use(json({ limit: '10mb' }))
app.use(urlencoded({ extended: true, limit: '10mb' }))
app.use(correlationIdMiddleware)
app.use(morganMiddleware)
app.use(setHeaders)

RegisterRoutes(app)

// any error handler middleware should come after RegisterRoutes
app.use(async (err: unknown, _: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const error = err as ApiResponse
  logger.error('account-api app.ts error', err)
  if (error?.resData?.status === 'error') {
    return res.status(error.resCode).json(error.resData)
  }
  next()
})

if (ENABLE_SWAGGER && ENABLE_SWAGGER === 'true') {
  app.use('/docs', serve, async (_: Request, res: Response) => {
    return res.send(generateHTML(swaggerJson))
  })
}

app.get('/healthz', (_, res) => {
  res.send('Account API is running...')
})

const startServer = (): undefined => {
  const server = app.listen(PORT, () => {
    logger.info(`account-api started on port ${PORT}`)

    // this will create the merkle tree
    createMerkleTree([])
  })
  server.on('error', (e) => logger.error(`account-api failed to start with error`, e))
}

export { app, startServer }
