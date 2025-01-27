import { IHeaders } from '@duelnow/kafka-client'
export interface MixpanelMessageHeaders extends IHeaders {
  ip: string
  ua: string
  referer?: string
  utm?: string
  caller: string
  callerId: string
  correlationId: string
}

export interface MixpanelMessageProperties {
  ip: string
  browser: string | undefined
  device: string | undefined
  os: string | undefined
  referer?: string
  utm?: string
  distinct_id?: string
  device_id?: string
  correlation_id?: string
}

export interface UpdatedProperties {
  $email?: string
  $first_name?: string
  $last_name?: string
  meta?: string
  email_verified?: boolean
  old_email?: string
  nickname?: string
}

export interface UserProperties {
  $email: string
  $first_name?: string
  $last_name?: string
  sign_up_method: string
  sign_up_source: string
  referrer_user_id: string
  $created: string
}
