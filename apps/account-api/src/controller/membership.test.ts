import { ErrorType, HttpResponseStatus, apiResponse, errorResponse } from '@duelnow/utils'

import { MembershipController } from './membership'
import { MembershipService } from '../service/membership'

jest.mock('../service/membership.ts')
jest.mock('@duelnow/redis')
jest.mock('@duelnow/logger')
jest.mock('../utils/kafkaProducer')
jest.mock('@duelnow/utils', () => ({
  ...jest.requireActual('@duelnow/utils'),
  apiResponse: jest.fn(),
  errorResponse: jest.fn(),
  generateCode: jest.fn().mockReturnValue('123456'),
}))

jest.mock('../utils/firebase', () => ({
  updateFirebaseUserEmail: jest.fn(),
}))

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('../utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn(), warn: jest.fn() },
  checkLogInfo: jest.fn((_headers, fn) => fn()),
  expressLogger: jest.fn(),
}))

describe('MembershipController - getMemberships', () => {
  let controller: MembershipController

  beforeEach(() => {
    controller = new MembershipController()
  })

  it('should return memberships', async () => {
    const mockPreferences = {
      levelId: 0,
      levelName: '',
      description: '',
      eligibilityThreshold: {},
      feeDeductionPct: 1,
      referralBonusPct: 2,
      status: 'Active',
    }

    MembershipService.prototype.getMemberships = jest.fn().mockResolvedValueOnce(mockPreferences)

    await controller.getMemberships()
    expect(apiResponse).toHaveBeenCalledWith(HttpResponseStatus.Ok, mockPreferences)
  })

  it('should catch error when service throws error', async () => {
    jest.spyOn(MembershipService.prototype, 'getMemberships').mockRejectedValue(new Error('Test rejected'))

    const response = await controller.getMemberships()
    expect(errorResponse).toHaveBeenCalledWith(ErrorType.CatchError, HttpResponseStatus.BadRequest, {
      error: new Error('Test rejected'),
    })
    expect(response).toBeUndefined()
  })
})
