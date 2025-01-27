/* eslint-disable @typescript-eslint/no-explicit-any */
import { raiseError } from '@duelnow/utils'
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse } from 'axios'

import { correlationIdMiddleware } from './utils/logger'

import AxiosRequest from './index'

jest.mock('axios')
jest.mock('@duelnow/utils', () => ({
  raiseError: jest.fn(), // Ensure raiseError is properly mocked
}))

jest.mock('@duelnow/logger', () => ({
  Logger: jest.fn(),
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  getLogger: jest.fn(),
}))

jest.mock('./utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  correlationIdMiddleware: jest.fn(),
}))

describe('AxiosRequest', () => {
  let mockAxios: jest.Mocked<AxiosInstance>

  beforeEach(() => {
    mockAxios = {
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      create: jest.fn().mockReturnValue(this),
    } as unknown as jest.Mocked<AxiosInstance>

    jest.spyOn(axios, 'create').mockReturnValue(mockAxios)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an axios instance with correct configuration', () => {
    const baseUrl = 'http://example.com'
    const instance = AxiosRequest(baseUrl)

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' },
    })

    expect(instance).toBe(mockAxios)
  })

  it('should add request interceptor that logs request info', () => {
    AxiosRequest('http://example.com')

    const requestInterceptor = mockAxios.interceptors.request.use as jest.Mock
    const mockConfig: AxiosRequestConfig = { headers: {}, url: '/test', data: { key: 'value' } }

    requestInterceptor.mock.calls[0][0](mockConfig)

    expect(correlationIdMiddleware).toHaveBeenCalledWith(mockConfig.headers, null, expect.any(Function))
  })

  it('should handle request interceptor error', () => {
    AxiosRequest('http://example.com')

    const errorInterceptor = mockAxios.interceptors.request.use as jest.Mock
    const mockError: AxiosError = {
      response: undefined,
      isAxiosError: true,
      config: { headers: {} as AxiosRequestHeaders },
      message: 'Error occurred',
      name: 'AxiosError',
      toJSON: jest.fn(),
    }

    return errorInterceptor.mock.calls[0][1](mockError).catch((error: any) => {
      expect(error).toBe(mockError)
    })
  })

  it('should add response interceptor that logs response info', () => {
    AxiosRequest('http://example.com')

    const responseInterceptor = mockAxios.interceptors.response.use as jest.Mock
    const mockResponse: AxiosResponse = {
      data: { key: 'value' },
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
      config: { headers: {} as AxiosRequestHeaders },
    }

    const response = responseInterceptor.mock.calls[0][0](mockResponse)

    expect(correlationIdMiddleware).toHaveBeenCalledWith(mockResponse.config.headers, null, expect.any(Function))
    expect(response).toEqual(mockResponse)
  })

  it('should handle response interceptor error', () => {
    AxiosRequest('http://example.com')

    const errorInterceptor = mockAxios.interceptors.response.use as jest.Mock
    const mockError = {
      response: {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
        data: { resCode: 400, resData: { data: 'error message' } },
        statusText: 'Bad Request',
        config: { headers: {} as AxiosRequestHeaders },
      },
      isAxiosError: true,
      config: { headers: {} as AxiosRequestHeaders },
      message: 'Error occurred',
      name: 'AxiosError',
      toJSON: jest.fn(),
    }

    return errorInterceptor.mock.calls[0][1](mockError).catch((errorResponse: any) => {
      expect(correlationIdMiddleware).toHaveBeenCalledWith(mockError.config.headers, null, expect.any(Function))
      expect(raiseError).toHaveBeenCalledWith(400, mockError.message)
    })
  })

  it('should handle response error with no response object', () => {
    AxiosRequest('http://example.com')

    const errorInterceptor = mockAxios.interceptors.response.use as jest.Mock
    const mockError: AxiosError = {
      response: undefined,
      isAxiosError: true,
      config: { headers: {} as AxiosRequestHeaders },
      message: 'Error occurred',
      name: 'AxiosError',
      toJSON: jest.fn(),
    }

    return errorInterceptor.mock.calls[0][1](mockError).catch(() => {
      expect(correlationIdMiddleware).toHaveBeenCalledWith(mockError.config?.headers, null, expect.any(Function))
      expect(raiseError).toHaveBeenCalled()
    })
  })
})
