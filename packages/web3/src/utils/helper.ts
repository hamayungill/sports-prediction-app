/* eslint-disable  @typescript-eslint/no-explicit-any */

import axios from '@duelnow/axios-extended'
import { getRedisKey, setRedisKey } from '@duelnow/redis'
import * as jose from 'jose'

import { infuraJwtKeyId, infuraJwtPrivateKey } from './envs'
import { logger } from './logger'

const createJWT = async (): Promise<string> => {
  const jwtRedisKey = `infura:jwt`
  const token = await getRedisKey(jwtRedisKey)

  if (token) {
    logger.info(`Infura JWT token is already existed in redis and returned from there.`)
    return token
  }

  if (!infuraJwtPrivateKey) {
    logger.info(`Infura_Jwt_Private_Key not found while creating the JWT token for the infura`)
    throw new Error(`Infura private key not found`)
  }

  // Convert the private key to a KeyLike object
  const key = await jose.importPKCS8(infuraJwtPrivateKey, 'RS256')

  // Define the payload for the JWT
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token expiration time is 1 hour
    aud: 'infura.io', // Audience claim
  }

  // Define the protected header (includes alg and kid)
  const protectedHeader = {
    alg: 'RS256',
    typ: 'JWT',
    kid: infuraJwtKeyId,
  }

  // Create the JWT
  const jwt = await new jose.SignJWT(payload).setProtectedHeader(protectedHeader).sign(key)
  await setRedisKey(jwtRedisKey, jwt, 60 * 60)

  logger.info(`JWT created and stored in the redis successfully`)

  return jwt
}

class FetchHttpProvider {
  private url: string
  private token: string

  constructor(url: string, token: string) {
    this.url = url
    this.token = token
  }

  // Implement the 'request' method from EIP-1193
  async request(payload: any): Promise<any> {
    return fetchWithHeaders(this.url, payload, this.token)
  }
}

const fetchWithHeaders = async (url: string, payload: any, token: string): Promise<any> => {
  const response = await axios(url, {
    Authorization: `Bearer ${token}`,
  }).post('', JSON.stringify(payload))

  if (!response.data) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  return response.data
}

export { FetchHttpProvider, createJWT, fetchWithHeaders }
