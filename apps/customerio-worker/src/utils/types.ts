import { IHeaders } from '@duelnow/kafka-client'
export interface CioMessageHeaders extends IHeaders {
  caller: string
  callerId: string
  correlationId: string
}
export interface UpdatedProperties {
  email?: string
  first_name?: string
  last_name?: string
  meta?: string
  email_verified?: boolean
  old_email?: string
  nickname?: string
}
