/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs'
import * as path from 'path'

import * as winston from 'winston'
import LogzioWinstonTransport from 'winston-logzio'

import Logger, { getLogger } from './logger'
import * as utils from './utils'

jest.mock('fs')
jest.mock('path')

jest.mock('winston', () => {
  const original = jest.requireActual('winston')
  return {
    ...original,
    createLogger: jest.fn((options) => ({
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      options,
    })),
    transports: {
      Console: jest.fn(() => ({})),
    },
  }
})
jest.mock('winston-daily-rotate-file', () =>
  jest.fn().mockImplementation(() => ({
    log: jest.fn(),
  })),
)
jest.mock('winston-logzio')
jest.mock('./utils', () => ({
  getCorrelationId: jest.fn(),
  getCallerId: jest.fn(),
}))
jest.mock('./const', () => ({
  LOGZIO_TOKEN: 'fake_token',
  LOG_LEVEL: 'debug',
}))

describe('Logger', () => {
  const mockNamespace = 'test'
  const customLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3, // Custom http level for Morgan logs
    debug: 4,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create the log directory if it does not exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync')

    new Logger(mockNamespace)

    expect(fs.existsSync).toHaveBeenCalledWith(path.join('logs', mockNamespace))
    expect(mkdirSyncMock).toHaveBeenCalledWith(path.join('logs', mockNamespace), { recursive: true })
  })

  it('should configure the logger with the correct transports and levels', () => {
    jest.spyOn(utils, 'getCorrelationId').mockReturnValue('mock-correlation-id')
    jest.spyOn(utils, 'getCallerId').mockReturnValue('mock-caller-id')

    process.env.LOG_LEVEL = 'debug'

    new Logger(mockNamespace)

    const loggerConfig = (winston.createLogger as jest.Mock).mock.calls[0][0]

    // Validate basic structure
    expect(loggerConfig).toMatchObject({
      levels: customLevels,
      level: 'debug',
      defaultMeta: { namespace: mockNamespace },
    })
  })

  it('should add Logz.io transport if LOGZIO_TOKEN is set', () => {
    new Logger(mockNamespace)

    expect(winston.createLogger).toHaveBeenCalled()
    expect(LogzioWinstonTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
        name: 'winston_logzio',
        token: 'fake_token',
        host: 'listener.logz.io',
      }),
    )
  })

  it('should log messages using the log method', () => {
    const loggerInstance = new Logger(mockNamespace)
    const logSpy = jest.spyOn(loggerInstance['logger'], 'log')

    loggerInstance.log('info', 'Test log message')
    expect(logSpy).toHaveBeenCalledWith({ level: 'info', message: 'Test log message' })
  })

  it('should log debug messages', () => {
    const loggerInstance = new Logger(mockNamespace)
    const debugSpy = jest.spyOn(loggerInstance['logger'], 'debug')

    loggerInstance.debug('Debug message')
    expect(debugSpy).toHaveBeenCalledWith({ message: 'Debug message', stack: undefined })
  })

  it('should log info messages', () => {
    const loggerInstance = new Logger(mockNamespace)
    const infoSpy = jest.spyOn(loggerInstance['logger'], 'info')

    loggerInstance.info('Info message')
    expect(infoSpy).toHaveBeenCalledWith({ message: 'Info message', stack: undefined })
  })

  it('should log warn messages', () => {
    const loggerInstance = new Logger(mockNamespace)
    const infoSpy = jest.spyOn(loggerInstance['logger'], 'warn')

    loggerInstance.warn('Warn message')
    expect(infoSpy).toHaveBeenCalledWith({ message: 'Warn message', stack: undefined })
  })

  it('should log http messages', () => {
    const loggerInstance = new Logger(mockNamespace)
    const infoSpy = jest.spyOn(loggerInstance['logger'], 'log')

    loggerInstance.http('Http message')
    expect(infoSpy).toHaveBeenCalled()
  })

  it('should log error messages', () => {
    const loggerInstance = new Logger(mockNamespace)
    const errorSpy = jest.spyOn(loggerInstance['logger'], 'error')

    loggerInstance.error('Error message')
    expect(errorSpy).toHaveBeenCalledWith({ message: 'Error message', stack: undefined })
  })

  it('should throw an error if namespace is not provided to getLogger', () => {
    expect(() => getLogger('')).toThrow('Namespace is required and cannot be an empty string.')
  })

  it('should return a new Logger instance for a valid namespace', () => {
    const logger = getLogger(mockNamespace)
    expect(logger).toBeInstanceOf(Logger)
  })

  it('should call error stack', () => {
    const logger = getLogger(mockNamespace)
    logger.error(new Error('test'))
    expect(logger.error).not.toThrow()
  })
})
