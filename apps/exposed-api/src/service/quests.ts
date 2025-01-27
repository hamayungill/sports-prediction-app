/**
 * In the services we will call proxy APIs
 * For eg: From services we will have to call sports-api service to get quest related info
 */
import sports from '../apis/sports'
import { getHeaders } from '../utils/getHeaders'
import { AxiosResponse } from '../utils/types'

export class QuestService {
  public async getQuests(queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`quests`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }

  public async getUserQuestStats(queries: object, headers: object): Promise<AxiosResponse> {
    const { status, data } = await sports.get(`quests/stats/me`, {
      params: queries,
      headers: getHeaders(headers),
    })
    return { status, data }
  }
}
