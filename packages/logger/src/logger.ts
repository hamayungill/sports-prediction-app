/* eslint-disable  @typescript-eslint/no-explicit-any */
import fs from 'fs'
import path from 'path'
import util from 'util'

import { Logger as WinstonLogger, createLogger, format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import LogzioWinstonTransport from 'winston-logzio'

import { LOGZIO_TOKEN } from './const'
import { getCallerId, getCorrelationId } from './utils'

// Define custom levels
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3, // Custom http level for Morgan logs
  debug: 4,
}

// Utility function to fetch the log level for a namespace
const getLogLevel = (namespace: string): string => {
  const namespaceLogLevel = process.env[`LOG_LEVEL_${namespace.toUpperCase()}`]
  return namespaceLogLevel || process.env.LOG_LEVEL || 'info'
}

class Logger {
  private logger: WinstonLogger

  constructor(namespace: string) {
    const logDirectory = path.join('logs', namespace)

    // Ensure the directory exists
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true })
    }

    // Create DailyRotateFile transport
    const createRotateTransport = (logType: string): DailyRotateFile =>
      new DailyRotateFile({
        filename: path.join(logDirectory, `${namespace}_${logType}_%DATE%.log`),
        datePattern: 'YYYY_MM_DD',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
      })

    // Configure the logger
    const logzioOptions = {
      levels: customLevels,
      level: getLogLevel(namespace),
      defaultMeta: { namespace },
      format: format.combine(
        format.timestamp(),
        format((info) => {
          info.correlationId = getCorrelationId()
          info.callerId = getCallerId()

          return info
        })(),
        format.errors({ stack: true }),
        format.json(),
      ),
      transports: [new transports.Console(), createRotateTransport('application')],
      exceptionHandlers: [new transports.Console(), createRotateTransport('exceptions')],
      rejectionHandlers: [new transports.Console(), createRotateTransport('rejections')],
    }

    if (LOGZIO_TOKEN && LOGZIO_TOKEN !== 'false') {
      const logzioTransport = new LogzioWinstonTransport({
        level: getLogLevel(namespace),
        name: 'winston_logzio',
        token: LOGZIO_TOKEN,
        host: 'listener.logz.io',
      })
      // @ts-expect-error logzioTransport is a part of transport
      logzioOptions.transports.push(logzioTransport)
    }
    this.logger = createLogger(logzioOptions)
  }

  // Formats log arguments into a single string, stringifying objects for readability.
  private formatMessage = (args: any[]): { message: string; stack?: string } => {
    let stack: string | undefined = undefined

    // Helper function to parse Buffers or handle objects
    const parseBuffers = (data: any): any => {
      if (Buffer.isBuffer(data)) {
        return data.toString('utf-8')
      }
      if (Array.isArray(data)) {
        return data.map(parseBuffers)
      }
      if (typeof data === 'object' && data !== null) {
        return Object.entries(data).reduce(
          (acc, [key, value]) => {
            acc[key] = parseBuffers(value)
            return acc
          },
          {} as Record<string, any>,
        )
      }
      return data
    }

    const message = args
      .map((arg) => {
        if (arg instanceof Error) {
          stack = arg.stack
          return arg.message
        }
        if (typeof arg === 'string') {
          try {
            // Attempt to parse the string; if it fails, return the original string
            return JSON.stringify(JSON.parse(arg))
          } catch {
            return arg // It's not a JSON string, so return as-is
          }
        }
        if (typeof arg === 'object') {
          try {
            // Convert object to a minified JSON string
            return JSON.stringify(parseBuffers(arg))
          } catch {
            return util.inspect(arg, { depth: null, colors: false }) // Use util.inspect for fallback
          }
        }
        return String(arg)
      })
      .join(' ')

    return { message, stack }
  }

  log = (level: string, ...args: any[]): void => {
    const { message, stack } = this.formatMessage(args)
    this.logger.log({ level, message, stack })
  }

  debug = (...args: any[]): void => {
    const { message, stack } = this.formatMessage(args)
    this.logger.debug({ message, stack })
  }

  http = (...args: any[]): void => {
    const { message, stack } = this.formatMessage(args)
    this.logger.log('http', { message, stack })
  }

  info = (...args: any[]): void => {
    const { message, stack } = this.formatMessage(args)
    this.logger.info({ message, stack })
  }

  warn = (...args: any[]): void => {
    const { message, stack } = this.formatMessage(args)
    this.logger.warn({ message, stack })
  }

  error = (...args: any[]): void => {
    const { message, stack } = this.formatMessage(args)
    this.logger.error({ message, stack })
  }
}

// Export function to get an instance of Logger
export const getLogger = (namespace: string): Logger => {
  if (!namespace) {
    throw new Error('Namespace is required and cannot be an empty string.')
  }
  return new Logger(namespace)
}

export default Logger
