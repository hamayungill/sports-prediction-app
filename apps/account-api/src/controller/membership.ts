import { ApiResponse, ErrorType, HttpResponseStatus, apiResponse, errorResponse } from '@duelnow/utils'
import { Controller, Get, Route } from 'tsoa'

import { MembershipService } from '../service/membership'
import { logger } from '../utils'

@Route('memberships')
export class MembershipController extends Controller {
  @Get('')
  public async getMemberships(): Promise<ApiResponse | null> {
    try {
      const membershipData = await new MembershipService().getMemberships()
      return apiResponse(HttpResponseStatus.Ok, membershipData)
    } catch (err) {
      logger.error('get memberships error:', err)
      this.setStatus(HttpResponseStatus.BadRequest)
      return errorResponse(ErrorType.CatchError, HttpResponseStatus.BadRequest, { error: err })
    }
  }
}
