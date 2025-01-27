import { Prisma } from '@duelnow/database'
import { SignUpMethod } from '@duelnow/utils'
/* eslint-disable @typescript-eslint/no-explicit-any */

interface UsersResponse {
  users: Prisma.Users[]
  count: number
}

interface UserCreationParams {
  externalUserId: string
  email?: string
  walletAddress: string
  firstName?: string
  lastName?: string
  signUpMethod?: SignUpMethod
  signUpSource?: string
  anonymousId?: string
  nickname?: string
  referrerCode?: string
}
interface UserCreationModel extends UserCreationParams {
  isEmailVerified?: boolean
}

export type { UserCreationModel, UserCreationParams, UsersResponse }
