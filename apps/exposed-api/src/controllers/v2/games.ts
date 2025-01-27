/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiResponseStatus, CallerType, ERROR_CODES, HTTP_RESPONSE_STATUS } from '@duelnow/constants'
import { ErrorResponse, FailResponse, SuccessResponse } from '@duelnow/types'
import { sendError, sendSuccess } from '@duelnow/utils'
import { Request as Req } from 'express'
import { Controller, Example, Get, Header, Query, Request, Response, Route, Tags } from 'tsoa'

import { logger } from '../../utils/logger'

const { FETCH_GAMES_LIST } = ERROR_CODES.GAMES

@Route('v2/games')
export class GamesControllerV2 extends Controller {
  /**
   * Retrieves a list of games based on filters, sorting, and field selection.
   * @param req The HTTP request object from Express.
   * @param correlationId A UUID v4 for tracking the request across services.
   * @example correlationId "813322a1-fd62-40f2-93a2-b3992c048012"
   * @param caller Specifies the caller of the API.
   * @param callerId A unique identifier for the caller. For anonymous users, provide a randomly generated UUID; for authenticated users, provide their user ID.
   * @example callerId "6c797801-2d21-4f34-ab27-e2085bf7b24d"
   * @param filter A filter string used to narrow down the results.
   * ### Syntax:
   * `filter=field:operator:value`
   * ### Supported Fields:
   * - `sportId:<operator>:<number>`: Filters results by sport ID.
   * - `leagueId:<operator>:<number>`: Filters results by league ID.
   * - `search:<operator>:<string>`: Search by team names or the team abbreviation.
   * ### Supported Operators:
   * - `eq`: Equals
   * - `gt`: Greater than
   * - `gte`: Greater than or equal
   * - `has`: Contains the specified string
   * - `lt`: Less than
   * - `lte`: Less than or equal
   * - `in`: Matches any value from a list
   * ### Notes:
   * - Multiple filters can be combined by separating them with a comma. For example:
   *   `filter=leagueId:eq:1,sportId:in:[1,2,3]`
   * - Ensure values are correctly encoded when used in URLs.
   * @example filter "filter=leagueId:eq:1"
   * @example filter "filter=leagueId:eq:1,sportId:in:[1,2,3]"
   * @param sort Defines the sorting of results.
   * ### Syntax:
   * `sort=field:direction`
   * ### Supported Fields:
   * - `startTsUtc`: Sort games by their start timestamp (Unix timestamp in UTC).
   * ### Directions:
   * - `asc`: Sort in ascending order.
   * - `desc`: Sort in descending order.
   * @example sort "sort=startTsUtc:desc"
   * @param limit Define the maximum number of items to return. Defaults to 25 if not specified.
   * @example limit "limit=50"
   * @param cursor Opaque string value for pagination to retrieve additional results.
   * ### Notes:
   * - Cursor strings typically end with the = character. When presenting this value as a URL or POST
   * parameter, it must be encoded as `%3D`.
   * @example cursor "cursor=eyJvZmZzZXQiOjI1LCJpZCI6MzQ1fQ%3D"
   */
  @Get('')
  @Tags('Games', 'v2')
  @Example<SuccessResponse>(
    {
      status: ApiResponseStatus.Success,
      data: { games: [] }, // TODO: to fill in with actual response payload structure for this route.
      meta: { nextCursor: 'dXNlcjpXMDdRQ1JQQTQ=' },
    },
    'Success with Data',
  )
  @Example<SuccessResponse>(
    {
      status: ApiResponseStatus.Success,
      data: null,
    },
    'Success with No Data',
  )
  @Response<FailResponse>('4XX', 'Fetched Games Error')
  @Response<ErrorResponse>(500, 'Internal server error')
  public async getGames(
    @Request() req: Req,
    @Header('Correlation-Id') correlationId: string,
    @Header('Caller') caller: CallerType,
    @Header('Caller-Id') callerId: string,
    @Query() filter?: string,
    @Query() sort?: string,
    @Query() limit?: number,
    @Query() cursor?: string,
  ): Promise<SuccessResponse | FailResponse | ErrorResponse> {
    try {
      // TODO: to be replaced with actual logic
      this.setStatus(HTTP_RESPONSE_STATUS.OK)
      return sendSuccess(null)
    } catch (err) {
      logger.error(`getGames error`, err)
      this.setStatus(FETCH_GAMES_LIST.HTTP_STATUS)
      return sendError(FETCH_GAMES_LIST.CODE, FETCH_GAMES_LIST.MESSAGE)
    }
  }
}
