/**
 * In the services we will call proxy APIs
 * For eg: From services we will have to call sports-api service to get sports related info
 */
import {
  CreateChallenge,
  JoinChallenge,
  JoinChallengeForm,
  SmartContractResponse,
  UpdateChallengeType,
  UpdateTiebreaker,
  UpsertFavorites,
  UpsertLineups,
  UpstakeTokenQty,
} from '@duelnow/utils'

import sports from '../apis/sports'
import { getHeaders } from '../utils/getHeaders'
import { AxiosResponse } from '../utils/types'

export class SportsService {
  public async createChallenge(headers: object, createChallengePayload: CreateChallenge): Promise<AxiosResponse> {
    const { status, data } = await sports.post('sports/challenges', createChallengePayload, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async joinChallenge(
    headers: object,
    joinChallengePayload: JoinChallenge,
    challengeId: number,
  ): Promise<AxiosResponse> {
    const { status, data } = await sports.post(`sports/challenges/${challengeId}`, joinChallengePayload, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async upsertLineups(headers: object, upsertLineupsPayload: UpsertLineups): Promise<AxiosResponse> {
    const { status, data } = await sports.patch('sports/lineups', upsertLineupsPayload, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getSports(queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`sports`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getDefaultOdds(queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`sports/default-odds`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async joinChallengeForm(headers: object, joinChallengeFormPayload: JoinChallengeForm): Promise<AxiosResponse> {
    const { status, data } = await sports.post('sports/join-challenge-form', joinChallengeFormPayload, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async updateTiebreaker(headers: object, updateTiebreakerPayload: UpdateTiebreaker): Promise<AxiosResponse> {
    const { status, data } = await sports.patch('sports/tiebreaker', updateTiebreakerPayload, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async updateChallengeType(
    headers: object,
    updateChallengeTypePayload: UpdateChallengeType,
  ): Promise<AxiosResponse> {
    const { status, data } = await sports.patch('sports/challenges/type', updateChallengeTypePayload, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async smartContractResponse(
    headers: object,
    smartContractResponsePayload: SmartContractResponse,
  ): Promise<AxiosResponse> {
    const { status, data } = await sports.patch('sports/challenges/smartcontract', smartContractResponsePayload, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async cancelChallenge(headers: object, challengeId: number): Promise<AxiosResponse> {
    const { status, data } = await sports.patch(
      `sports/challenges/cancel/${challengeId}`,
      {},
      {
        headers: getHeaders(headers),
      },
    )
    return { status, data }
  }

  public async getFavorites(queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`sports/challenges/favorites`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async updateFavorites(headers: object, payload: UpsertFavorites): Promise<AxiosResponse> {
    const { status, data } = await sports.patch(`sports/challenges/favorites`, payload, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getPotentialReturns(queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`sports/potential-returns`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async upstakeTokenQty(headers: object, payload: UpstakeTokenQty): Promise<AxiosResponse> {
    const { status, data } = await sports.patch(`sports/challenges/upstake`, payload, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async removeJoinRedisKey(headers: object, challengeId: number): Promise<AxiosResponse> {
    const { status, data } = await sports.delete(`sports/challenges/${challengeId}/redis`, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getLeagues(headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`sports/leagues`, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }
}
