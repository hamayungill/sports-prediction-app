/**
 * In the services we will call proxy APIs
 * For eg: From services we will have to call account-api service to get account related info
 */

import account from '../apis/account'
import { getHeaders } from '../utils/getHeaders'
import { AxiosResponse } from '../utils/types'

export class MembershipService {
  public async getMemberships(headers: object): Promise<AxiosResponse> {
    const { status, data } = await account.get(`memberships`, {
      headers: getHeaders(headers),
    })
    return { status, data }
  }
}
