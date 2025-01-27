import { ApiResponse, HttpResponseStatus, apiResponse } from '@duelnow/utils'
import { Controller, Get, Header, Request, Route, Security, Tags } from 'tsoa'

import { MembershipService } from '../../service/membership'
import { logger } from '../../utils/logger'
import { AuthenticatedRequest } from '../../utils/types'

@Route('v1/memberships')
export class MembershipController extends Controller {
  @Get('')
  @Security('bearerAuth')
  @Tags('Memberships')
  public async getMemberships(
    @Header('apppubkey') _apppubkey: string,
    @Header('authorizationtype') _authorizationtype: string,
    @Header('authorization') _authorization: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse | null> {
    try {
      const membershipService = new MembershipService()
      const membershipData = await membershipService.getMemberships(req.headers)
      return apiResponse(HttpResponseStatus.Ok, membershipData.data)
    } catch (err) {
      logger.error('get memberships error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return apiResponse(HttpResponseStatus.BadRequest, { error: err })
    }
  }
}
