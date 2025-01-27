/* eslint-disable @typescript-eslint/no-explicit-any */
import UAParser from 'ua-parser-js'

export const parseUserAgent = (headers: Record<string, any>): Record<string, any> => {
  stringifyHeaders(headers)

  let userAgent: string = ''

  if (typeof headers.ua === 'string') {
    userAgent = headers.ua
  }

  const parser = new UAParser()
  const ua = parser.setUA(userAgent).getResult()
  return ua
}

export const stringifyHeaders = (headers: Record<string, any>): void => {
  Object.keys(headers).forEach((key) => {
    headers[key] = headers[key]?.toString()
  })
}
