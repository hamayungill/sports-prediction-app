/* eslint-disable  @typescript-eslint/no-explicit-any */

import { logger } from './logger'

export const getHeaders = (header: any): object => {
  const headersObj: any = {}
  const keys: string[] = Object.keys(header)
  const excludedKeys: string[] = ['content-length']
  if (keys.length) {
    keys.forEach((key: string) => {
      if (!excludedKeys.includes(key) && header[key]) {
        headersObj[key] = header[key]
      }
    })
  }
  logger.debug(`exposed-api getHeaders`, headersObj)
  return headersObj
}
