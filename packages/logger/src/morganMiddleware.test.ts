import { EventEmitter } from 'events'

import { createRequest, createResponse } from 'node-mocks-http'

import { getLogger } from './logger'
import morganMiddleware from './morganMiddleware'

jest.mock('./logger', () => ({
  getLogger: jest.fn(() => ({
    http: jest.fn(),
  })),
}))

describe('morganMiddleware', () => {
  let logger: ReturnType<typeof getLogger>

  beforeEach(() => {
    logger = getLogger('test-namespace')
    jest.clearAllMocks()
  })

  it('should log requests', () => {
    const middleware = morganMiddleware(logger)

    const req = createRequest({
      method: 'GET',
      url: '/test-route',
    })
    const res = createResponse({
      eventEmitter: EventEmitter,
    })

    const next = jest.fn()

    res.on('finish', () => {
      expect((logger.http as jest.Mock).mock.calls.length).toBeGreaterThan(0)

      const loggedMessage = JSON.parse((logger.http as jest.Mock).mock.calls[0][0])
      expect(loggedMessage).toMatchObject({
        method: 'GET',
        url: '/test-route',
        status: '200',
      })
    })

    res.statusCode = 200
    middleware(req, res, next)
    res.end()
  })

  it('should skip logging for /healthz route', () => {
    const middleware = morganMiddleware(logger)

    const req = createRequest({
      method: 'GET',
      url: '/healthz',
    })
    const res = createResponse({
      eventEmitter: EventEmitter,
    })

    const next = jest.fn()

    res.on('finish', () => {
      expect((logger.http as jest.Mock).mock.calls.length).toBe(0)
    })

    res.statusCode = 200
    middleware(req, res, next)
    res.end()
  })
})
