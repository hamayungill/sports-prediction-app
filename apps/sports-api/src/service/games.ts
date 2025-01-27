/* eslint-disable  @typescript-eslint/no-explicit-any */
import prismaClient, { Prisma } from '@duelnow/database'
import { GameStatus, GetParams } from '@duelnow/utils'

const { CategoryDepth, Status } = Prisma
const { challenges, playerInTeam, pickemChallengeLineups } = prismaClient

export class GamesService {
  public async getActiveWeeks(leagueId: number, betType?: string): Promise<{ week: string; stage: string }[] | []> {
    // prettier-ignore
    const weeks =
      await prismaClient.$queryRawUnsafe(`with wks as (select distinct on (tig.week_of_stage, tig.stage) tig.week_of_stage as week, tig.stage, tig.start_date "startDate", tig.api_week "apiWeek" from sport."sports_stage_status_data" tig 
      where tig.status ilike '${GameStatus.Scheduled}' and tig.api_status not ilike '${GameStatus.Cancelled}' and tig.start_date AT TIME ZONE 'UTC' >= (now() AT TIME ZONE 'UTC') + interval '5 Minute' and tig.league_id = ${leagueId} 
      ${betType === CategoryDepth.Pickem ? 'and (tig.valid_day = true or tig.valid_week = true)' : ''} order by tig.week_of_stage) select * from wks order by "startDate" asc;`)
    return Array.isArray(weeks) ? weeks : []
  }

  public async getGames(leagueId: string, { filter }: GetParams): Promise<object> {
    const leagueData = await prismaClient.leagues.findFirst({
      where: { leagueId: parseInt(leagueId) },
      select: {
        leagueName: true,
        sports: {
          select: {
            featureFlags: true,
          },
        },
      },
    })
    if (!leagueData) throw new Error('Invalid leagueId')
    const featureFlags: Record<string, any> | null =
      typeof leagueData?.sports?.featureFlags == 'object' ? leagueData?.sports?.featureFlags : {}
    const activeWeeks = await this.getActiveWeeks(parseInt(leagueId))
    if (!activeWeeks.length) throw new Error(`No active week found`)
    let selectedWeek = activeWeeks[0]?.['week']
    const stage = filter?.stage?.contains || activeWeeks[0]?.['stage']
    if (filter && filter?.week) {
      selectedWeek = filter.week.equals
    }
    // prettier-ignore
    let teamNameSearchQuery = `and tig.stage ilike '%${stage}%' `
    const chlngDepth = filter?.challengeDepth?.equals
    if (
      chlngDepth === CategoryDepth.DayPickem ||
      chlngDepth === CategoryDepth.WeekPickem ||
      chlngDepth === CategoryDepth.Pickem
    ) {
      teamNameSearchQuery = `and (tig.valid_day = TRUE or tig.valid_week = TRUE) `
    }
    if (filter && filter?.search) {
      const teamSearchKey = filter.search.contains
      // prettier-ignore
      teamNameSearchQuery += `and (tig.home ->> 'name' ilike '%${teamSearchKey}%' or tig.away ->> 'name' ilike '%${teamSearchKey}%' or tig.home ->> 'code' ilike '%${teamSearchKey}%' or 
      tig.away ->> 'code' ilike '%${teamSearchKey}%' or tig.home ->> 'abbreviation' ilike '%${teamSearchKey}%' or tig.away ->> 'abbreviation' ilike '%${teamSearchKey}%') `
    }
    // prettier-ignore
    const games = await prismaClient.$queryRawUnsafe(
      `with dedupes as (select DISTINCT ON (tig.game_id) tig.api_game_id "apiGameId" , tig.game_id "gameId", tig.day_of_stage "dayOfStage", tig.stage, tig.week_of_stage "weekOfStage",
       tig.api_status "apiStatus", tig.status , tig.start_date "startDate", tig.stage_start_date "stageStartDate", tig.home , tig.away ,
       tig.sport_id "sportId", tig.valid_day "validDay", tig.valid_week "validWeek", tig.sport, go2.odds from sport."sports_stage_status_data" tig 
       full outer join challenge.game_odds go2 on go2.game_id = tig.game_id
       where tig.status ilike '${GameStatus.Scheduled}' and tig.api_status not ilike '${GameStatus.Cancelled}' and tig.start_date AT TIME ZONE 'UTC' >= (now() AT TIME ZONE 'UTC') + interval '5 Minute'
       and tig.week_of_stage=${parseInt(selectedWeek)} and tig.league_id = '${parseInt(leagueId)}' ${teamNameSearchQuery} order by tig.game_id asc) SELECT * FROM dedupes ORDER BY "startDate" asc;`,
    )

    return { featureFlags, games }
  }

  public async getGamesInChallenge(inviteCode: string): Promise<object[]> {
    const challengeResp = await challenges.findFirst({
      where: { inviteCode },
      select: {
        challengeId: true,
        pickem: true,
        challengeDepth: true,
        games: {
          select: {
            data: true,
            apiSourceId: true,
            seasonId: true,
            seasons: {
              select: {
                leagues: {
                  select: {
                    leagueName: true,
                    leagueId: true,
                    sports: {
                      select: {
                        sportName: true,
                        featureFlags: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    if (!challengeResp?.pickem) throw new Error('pickem value is missing for the challenge')
    if (
      !(
        challengeResp?.challengeDepth === CategoryDepth.DayPickem ||
        challengeResp?.challengeDepth === CategoryDepth.WeekPickem
      )
    )
      throw new Error(`Games list is not available for challengeDepth = ${challengeResp?.challengeDepth}`)
    let query: string = ''
    if (challengeResp?.challengeDepth === CategoryDepth.DayPickem && challengeResp?.pickem) {
      const featureFlag = challengeResp.games.seasons.leagues?.sports.featureFlags
      const timezone =
        featureFlag && typeof featureFlag === 'object' && 'time_zone' in featureFlag ? featureFlag?.time_zone : 'UTC'
      const dateOfDay = new Date(challengeResp?.pickem)
      const nextDay = new Date(dateOfDay)
      nextDay.setDate(dateOfDay.getDate() + 1)

      query = `(sssd.start_date AT TIME ZONE '${timezone}') >= '${dateOfDay.toISOString().split('T')[0]}' and (sssd.start_date AT TIME ZONE '${timezone}') < '${nextDay.toISOString().split('T')[0]}'`
    } else {
      const week = challengeResp?.pickem?.toLowerCase()?.split('week ')?.[1]
      query = `sssd.week_of_stage = ${parseInt(week)}`
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS data type check manually handled
    const stage = typeof challengeResp?.games?.data === 'object' ? challengeResp?.games?.data?.stage : null
    if (stage && challengeResp?.games?.seasons?.leagues?.sports?.sportName?.toLowerCase() !== 'mma') {
      query += `${query ? ' and' : ''} sssd.stage ilike '${stage}'`
    }

    const lineupsData = await pickemChallengeLineups.findMany({
      where: {
        challengeId: challengeResp.challengeId,
        pickStatus: Status.Active,
      },
      select: {
        challengeResultId: true,
        gameId: true,
        teams: {
          select: {
            apiTeamId: true,
          },
        },
      },
    })

    const distinctChallengeResultIds = new Set(lineupsData.map((item) => item.challengeResultId))
    const distinctCount = distinctChallengeResultIds.size

    const gamesInChallenge = await prismaClient.$queryRawUnsafe(`
    with gms as (select DISTINCT ON (sssd.game_id) g.game_id "gameId", g.season_id "seasonId", g."data", g.created_at "createdAt", g.updated_at "updatedAt",
    g.processing_status "processingStatus", sssd.start_date "startDate", go2.odds, go2.bookmaker_title
    from sport.games g full outer join sport.sports_stage_status_data sssd on g.game_id = sssd.game_id 
    full outer join challenge.game_odds go2 on go2.game_id = g.game_id and go2.game_id = sssd.game_id
    where sssd.league_id = '${challengeResp.games.seasons.leagues?.leagueId}' and ${query} 
    and g.api_source_id = ${challengeResp.games.apiSourceId} and g.season_id = ${challengeResp.games.seasonId} order by sssd.game_id) select * from gms order by "startDate" asc;`)

    if (Array.isArray(gamesInChallenge) && lineupsData.length > 0) {
      gamesInChallenge.forEach((data) => {
        lineupsData.forEach((lineup) => {
          if (data.gameId == lineup.gameId && data.data.teams.home.id == lineup.teams?.apiTeamId) {
            if (data.data.teams.home.stats) {
              data.data.teams.home.pickCount += 1
              data.data.teams.home.stats = (data.data.teams.home.pickCount / distinctCount) * 100
            } else {
              data.data.teams.home.pickCount = 1
              data.data.teams.home.stats = (1 / distinctCount) * 100
            }
          }

          if (data.gameId == lineup.gameId && data.data.teams.away.id == lineup.teams?.apiTeamId) {
            if (data.data.teams.away.stats) {
              data.data.teams.away.pickCount += 1
              data.data.teams.away.stats = (data.data.teams.away.pickCount / distinctCount) * 100
            } else {
              data.data.teams.away.pickCount = 1
              data.data.teams.away.stats = (1 / distinctCount) * 100
            }
          }
        })
      })
    }
    return Array.isArray(gamesInChallenge) ? gamesInChallenge : []
  }

  public async getPlayersInTeam(teamIds: number[], leagueId: number, search: string): Promise<object[]> {
    let filterQuery: Record<string, object | number | string> = {
      teams: {
        apiTeamId: {
          in: teamIds,
        },
      },
      seasons: {
        leagueId,
      },
    }
    if (search) {
      filterQuery = {
        ...filterQuery,
        players: {
          OR: [
            {
              firstName: {
                startsWith: search,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                startsWith: search,
                mode: 'insensitive',
              },
            },
          ],
        },
      }
    }
    const playersList = await playerInTeam.findMany({
      where: filterQuery,
      include: {
        players: true,
      },
    })
    return playersList
  }
}
