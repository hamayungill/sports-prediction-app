import { NextFunction, Request, Response } from 'express'
import * as httpContext from 'express-http-context'
import { createRequest, createResponse } from 'node-mocks-http'

import correlationIdMiddleware from './correlationIdMiddleware'
import * as utils from './utils'

jest.mock('express-http-context', () => ({
  middleware: jest.fn(),
  set: jest.fn(),
}))

jest.mock('./utils', () => ({
  extractCorrelationId: jest.fn(),
  extractCallerId: jest.fn(),
}))

describe('correlationIdMiddleware', () => {
  let req: Request
  let res: Response
  let next: NextFunction

  beforeEach(() => {
    req = createRequest()
    res = createResponse()
    next = jest.fn()
  })

  it('should call httpContext.middleware with the correct parameters', () => {
    correlationIdMiddleware(req, res, next)

    expect(httpContext.middleware).toHaveBeenCalledWith(req, res, expect.any(Function))
  })

  it('should set correlationId and callerId in httpContext', () => {
    jest.spyOn(utils, 'extractCorrelationId').mockReturnValue('test-correlation-id')
    jest.spyOn(utils, 'extractCallerId').mockReturnValue('test-caller-id')

    // Simulate the middleware behavior
    jest.spyOn(httpContext, 'middleware').mockImplementation((req, res, cb) => cb())

    correlationIdMiddleware(req, res, next)

    expect(httpContext.set).toHaveBeenCalledWith('correlationId', 'test-correlation-id')
    expect(httpContext.set).toHaveBeenCalledWith('callerId', 'test-caller-id')
  })

  it('should call next after processing', () => {
    correlationIdMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('should handle cases where next is passed as the second parameter', () => {
    correlationIdMiddleware(req, null, next)

    expect(next).toHaveBeenCalled()
  })
})
