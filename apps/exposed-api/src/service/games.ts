/**
 * In the services we will call proxy APIs
 * For eg: From services we will have to call sports-api service to get sports related info
 */
import sports from '../apis/sports'
import { getHeaders } from '../utils/getHeaders'
import { AxiosResponse } from '../utils/types'

export class GamesService {
  public async getGames(leagueId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`games/${leagueId}`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getGamesInChallenge(inviteCode: string, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`games/challenges/${inviteCode}`, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getActiveWeeks(leagueId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`games/active-weeks/${leagueId}`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getPlayersInTeam(leagueId: string, queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`games/players/leagues/${leagueId}`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }
}
