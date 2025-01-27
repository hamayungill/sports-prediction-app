/* eslint-disable @typescript-eslint/no-explicit-any */
// Documentation link for kafka error handling
// https://www.notion.so/stormx/Kafka-2341b1c01b624f83ae06874375c5bcd9?pvs=4#409c029c34e94600aaf35748c25cb82d
import { Prisma } from '@duelnow/database'
import { FatalError, NonRetriableError, RetriableError } from '@duelnow/utils'

const isDatabaseRetriableError = (error: Prisma.Prisma.PrismaClientKnownRequestError): boolean => {
  switch (error.code) {
    case 'P1008':
    case 'P1011':
    case 'P1017':
    case 'P2024':
    case 'P2023':
      return true
    default:
      return false
  }
}

const isDatabaseFatalError = (error: Prisma.Prisma.PrismaClientKnownRequestError): boolean => {
  switch (error.code) {
    case 'P1000':
    case 'P1001':
    case 'P1003':
    case 'P1009':
    case 'P1013':
    case 'P2021':
    case 'P2022':
      return true
    default:
      return false
  }
}

export const raiseError = (error: any): Promise<void> => {
  const err = error as Prisma.Prisma.PrismaClientKnownRequestError
  if (isDatabaseRetriableError(err)) {
    throw new RetriableError(JSON.stringify(err))
  }
  if (isDatabaseFatalError(err)) {
    throw new FatalError(`DB fatal error ${err}`)
  }
  throw new NonRetriableError(`Query error ${err}`)
}
