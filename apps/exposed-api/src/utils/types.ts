/* eslint-disable  @typescript-eslint/no-explicit-any */
import { SignUpMethod } from '@duelnow/utils'
import { Request } from 'express'
export interface AuthenticatedRequest extends Request {
  user: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
}

export type AxiosResponse = {
  status: number
  data: any
}

export enum BetTypes {
  Game = 'Game',
  Pickem = 'Pickem',
  Player = 'Player',
  Team = 'Team',
}

export type PatchUserBody = {
  firstName?: string
  lastName?: string
  nickName?: string
  email?: string
}

export enum PatchUserField {
  Name = 'Name',
  NickName = 'NickName',
  Email = 'Email',
}

/**
 * TODO: model.ts file to be removed when the Prisma schema is defined
 * - model definations should be used from prisma schema only
 */
export interface SignInBody {
  email?: string
  walletAddress: string
  signUpMethod?: SignUpMethod
  signUpSource?: string
  anonymousId?: string
  nickname?: string
  referrerCode?: string
  inviteCode?: string
}

export type UserSignInParams = {
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
  inviteCode?: string
}

export type trackBody = {
  event: {
    name: string
    data: {
      path: string
    }
  }
}
