import { NextFunction, Request, Response } from 'express'
import { createRequest, createResponse } from 'node-mocks-http'

import { setHeaders } from '.'

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

describe('Run test', () => {
  const mockNext: NextFunction = jest.fn()

  test('setHeaders function test', () => {
    const reqst: Request = createRequest({
      method: 'GET',
      url: '/',
      headers: {
        'correlation-id': '3be3c89f-c8f6-4f66-99cc-a5401cdb26a6',
      },
    })
    const resp: Response = createResponse()

    setHeaders(reqst, resp, mockNext)
    expect(mockNext).toHaveBeenCalled()
  })
})
