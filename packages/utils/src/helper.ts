/* eslint-disable @typescript-eslint/no-explicit-any */
import os from 'os'

import { systemIp } from './consts'

const camelToSnakeCase = (key: string): string => key.replace(/([A-Z])/g, (letter) => `_${letter.toLowerCase()}`)

// Need to use any because we can't guarantee on the input data type
export const bufferToString = (data: any): string => {
  if (Buffer.isBuffer(data)) {
    try {
      return JSON.parse(data.toString())
    } catch (error) {
      throw new Error('Invalid JSON in buffer data')
    }
  }

  return data
}

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// generate invite code
export const generateCode = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  let index = 0
  while (index < length) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    code += characters.charAt(randomIndex)
    index += 1
  }
  return code
}

// get system IP
export const getSystemIp = (): string => {
  const networkInterfaces = os.networkInterfaces()
  const ipAddress = networkInterfaces?.lo0?.[0]?.address
  return ipAddress || systemIp || ''
}

export const isLocal = (): boolean => {
  return process.env.NODE_ENV === 'local'
}

export const transformKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item))
  } else if (obj !== null && obj.constructor === Object) {
    const newObj: { [key: string]: any } = {}
    Object.keys(obj).forEach((key) => {
      newObj[camelToSnakeCase(key)] = transformKeys(obj[key])
    })
    return newObj
  }
  return obj
}
