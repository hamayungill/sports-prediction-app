/**
 * In the services we will call proxy APIs
 * For eg: From services we will have to call sports-api service to get challenges related info
 */
import { UpdateChallengeMode } from '@duelnow/utils'

import sports from '../apis/sports'
import { getHeaders } from '../utils/getHeaders'
import { AxiosResponse } from '../utils/types'

export class ChallengesService {
  public async getContracts(queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/contracts`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getChallengeMetrics(inviteCode: string, userId: string, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/${inviteCode}/metrics/${userId}`, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getPickemChallengeLineups(
    inviteCode: string,
    challengeResultId: string,
    headers: object,
  ): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/${inviteCode}/lineups/${challengeResultId}`, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getUserChallenges(userId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/${userId}`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getChallengeParticipants(inviteCode: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/${inviteCode}/participants`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getChallengeLeaderboard(
    inviteCode: string,
    challengeResultId: string,
    headers: object,
  ): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/${inviteCode}/leaderboard/${challengeResultId}`, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getPublicChallenges(leagueId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/leagues/${leagueId}`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async listPublicChallenges(queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/public`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getCategoriesInGame(gameId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/categories/games/${gameId}`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getGroupsInCategory(categoryId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/categories/${categoryId}/groups`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getSubgroupsInGroups(groupId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/groups/${groupId}/subgroups`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async updateChallengeMode(
    headers: object,
    updateChallengeModePayload: UpdateChallengeMode,
    challengeId: string,
  ): Promise<AxiosResponse> {
    const { status, data } = await sports.patch(`challenges/${challengeId}/requests`, updateChallengeModePayload, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getPartialBetEvents(queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`challenges/requests`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }
}
