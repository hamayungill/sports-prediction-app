import prismaClient, { Prisma } from '@duelnow/database'
import { IKafkaMessage } from '@duelnow/kafka-client'
import { getRates } from '@duelnow/rates'
import { getRedisKey, setRedisKey } from '@duelnow/redis'
import {
  EVENTS,
  GetParams,
  JoinChallengeForm,
  PriceResult,
  PrismaParams,
  REDIS_KEYS,
  TOPICS,
  UpdateChallengeMode,
} from '@duelnow/utils'
import { JsonObject } from 'swagger-ui-express'

import { producer } from '../utils'
import { ChallengeFormat, partialStakeLimit } from '../utils/const'
import { ServiceResponse } from '../utils/types'

const { Status, CategoryDepth, ChallengeStatus, ContractType, ChallengeType, ChallengeMode, Outcome, ShareStatus } =
  Prisma
const {
  categoriesGroups,
  contracts,
  challenges,
  challengeParticipations,
  challengeResults,
  games,
  groupsSubgroups,
  pickemChallengeLineups,
  sportInCategory,
  users,
} = prismaClient

const calculateProfit = (odds: number, tokenStakedQty: number): number => {
  return odds < 0 ? (1 - 100 / (odds * 1) - 1) * Number(tokenStakedQty) : (odds / 100) * tokenStakedQty
}

export class ChallengesService {
  public async getContracts({ filter, sort, skip, take }: GetParams): Promise<ServiceResponse> {
    const queryObj: PrismaParams = {
      skip,
      take,
      where: {
        OR: [{ status: Status.Active }, { status: Status.Restricted }],
      },
      include: {
        networks: true,
      },
    }
    if (filter) queryObj.where = { ...queryObj.where, ...filter }
    if (sort) queryObj.orderBy = sort
    const data: any = await contracts.findMany(queryObj) // eslint-disable-line @typescript-eslint/no-explicit-any
    const tokensToFetch: string[] = []
    for (const token of data) {
      if (token.contractType === ContractType.Token && token.tokenName) {
        tokensToFetch.push(token.tokenName)
      }
    }

    if (tokensToFetch.length > 0) {
      const rates: PriceResult[] = await getRates(tokensToFetch)

      for (const [i, token] of data.entries()) {
        if (token.contractType === ContractType.Token && token.tokenName) {
          const rate = rates.find((r: PriceResult) => r.token === token.tokenName.toLowerCase())
          if (rate) {
            data[i].valueInUSD = rate.usdPrice
          }
        }
      }
    }

    const countQuery: PrismaParams = {}
    if (filter) countQuery.where = { ...queryObj.where, ...filter }
    const count = await contracts.count(countQuery)
    return { data, count }
  }

  public async getChallengeMetrics(
    inviteCode: string,
    userId: string,
  ): Promise<Record<string, object | number | string | boolean | null | undefined>> {
    const userData = await users.findFirst({
      where: {
        userId,
      },
      select: {
        walletAddress: true,
        userId: true,
      },
    })
    if (!userData) throw new Error(`User with userId = ${userId} not found`)
    const challengeResp = await challenges.findFirst({
      where: {
        inviteCode,
      },
      include: {
        _count: {
          select: {
            challengeParticipations: true,
            favorites: {
              where: {
                challenges: {
                  inviteCode,
                },
                userId,
                isFavorite: true,
              },
            },
          },
        },
        creator: {
          select: {
            walletAddress: true,
          },
        },
        teams: true,
        Players: true,
        games: {
          select: {
            apiSourceId: true,
            data: true,
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
                      },
                    },
                  },
                },
              },
            },
            gameOdds: true,
          },
        },
        challengeParticipations: {
          select: {
            paidWalletAddress: true,
            participantInputQty: true,
            participantInputUsd: true,
          },
        },
      },
    })
    if (challengeResp) {
      const participationData = await challengeParticipations.findMany({
        where: {
          challengeId: challengeResp.challengeId,
        },
        include: {
          walletAddress: {
            select: {
              userId: true,
            },
          },
          contracts: {
            include: {
              networks: true,
            },
          },
          challengeResults: {
            select: {
              participantPosition: true,
              participantOutcome: true,
              participantStatP1: true,
              participantStatP2: true,
              category: true,
              groups: true,
              subgroups: true,
              winCriteria: true,
            },
          },
        },
      })
      const participationObj: {
        profit: number
        participantOutcome: string | null | undefined
        odds: number
        potentialReturn: number
        category: object | null | undefined
        groups: object | null | undefined
        subgroups: object | null | undefined
        winCriteria: number | null | undefined
        participationWinLossQty: number | null | undefined
        participationWinLossUsd: number | null | undefined
      } = {
        profit: 0,
        participantOutcome: '',
        odds: 0,
        potentialReturn: 0,
        category: null,
        groups: null,
        subgroups: null,
        winCriteria: null,
        participationWinLossQty: null,
        participationWinLossUsd: null,
      }
      let isCreator: boolean = false
      let contracts: object | null = null
      let isFavour: boolean = false
      let favourTotal = 0
      let unFavourTotal = 0
      let tokenStakedQty = 0
      let challengeGroupId = 0
      let challengeResultId: number = 0
      let participantPosition: number | undefined | null
      let participantStatP1: number | null = 0
      let participantStatP2: number | null = 0
      let creatorParticipantStatP1: number | null = 0
      let creatorParticipantStatP2: number | null = 0
      let initializerStats: {
        participantStatP1: number | null | undefined
        participantStatP2: number | null | undefined
      } = {
        participantStatP1: null,
        participantStatP2: null,
      }
      const isCancellable: boolean =
        participationData.length === 1 &&
        new Date(challengeResp.startDate).getTime() > Date.now() &&
        challengeResp.status === ChallengeStatus.Pending
      for (const eachPartData of participationData) {
        challengeGroupId = eachPartData.challengeGroupId

        // Sending contracts / tokens, category, and groups used to create challenge
        if (eachPartData.walletAddress.userId === challengeResp.creatorAccountId) {
          contracts = eachPartData.contracts
          participationObj.category = eachPartData.challengeResults?.category
          participationObj.groups = eachPartData.challengeResults?.groups
          participationObj.subgroups = eachPartData.challengeResults?.subgroups
          participationObj.winCriteria = eachPartData.challengeResults?.winCriteria
          creatorParticipantStatP1 = Number(eachPartData.challengeResults?.participantStatP1)
          creatorParticipantStatP2 = Number(eachPartData.challengeResults?.participantStatP2)
        }
        // Sending data related to signed-in user
        if (userData.userId === eachPartData.walletAddress.userId) {
          challengeResultId = eachPartData.challengeResultId || 0
          participantStatP1 = Number(eachPartData.challengeResults?.participantStatP1)
          participantStatP2 = Number(eachPartData.challengeResults?.participantStatP2)
          participationObj.participantOutcome = eachPartData.challengeResults?.participantOutcome
          participantPosition = eachPartData.challengeResults?.participantPosition
          tokenStakedQty = Number(eachPartData.participationValueQty)
          participationObj.participationWinLossQty = Number(eachPartData.participationWinLossQty)
          participationObj.participationWinLossUsd = Number(eachPartData.participationValueUsd)
        }
        // eachPartData.participantRole is "Initializer" then assign values to "initializerStats"
        if (eachPartData.participantRole?.toLowerCase() === 'initializer') {
          initializerStats = {
            participantStatP1: Number(eachPartData.challengeResults?.participantStatP1),
            participantStatP2: Number(eachPartData.challengeResults?.participantStatP2),
          }
        }
        if (challengeResp.challengeMode === ChallengeMode.OneVsOne) {
          let odds = Number(eachPartData.participantOdds) || 100
          // When the creator is looking at the screen or other person is looking at the screen when both participated
          if (userData.userId === eachPartData.walletAddress.userId) {
            tokenStakedQty = Number(eachPartData.participationValueQty)
            isCreator = userData.userId === challengeResp.creatorAccountId
            participationObj.odds = Number(eachPartData?.participantOdds) || 0
          } else if (participationData.length > 1) {
            tokenStakedQty = Number(eachPartData.participationValueQty)
            if (!isCreator) participationObj.odds = Number(eachPartData?.participantOdds) || 0
          } else {
            // When the opponent is looking at the screen before joining
            tokenStakedQty = Number(eachPartData.participationValueQty)
            participationObj.participantOutcome =
              eachPartData.challengeResults?.participantOutcome === Outcome.Win ? Outcome.Lose : Outcome.Win
            participationObj.odds = -Number(eachPartData?.participantOdds) || 0
            tokenStakedQty = calculateProfit(odds, tokenStakedQty)
            odds = -1 * odds
          }
          const profit = calculateProfit(odds, tokenStakedQty)
          participationObj.profit = profit
          participationObj.potentialReturn = Number(tokenStakedQty) + profit
        } else if (
          (challengeResp.challengeMode === ChallengeMode.Group ||
            challengeResp.challengeMode === ChallengeMode.Partial) &&
          challengeResp.challengeDepth !== CategoryDepth.WeekPickem &&
          challengeResp.challengeDepth !== CategoryDepth.DayPickem
        ) {
          if (eachPartData.walletAddress.userId === userData.userId) {
            isFavour = eachPartData.challengeResults?.participantOutcome === Outcome.Win
          }
          favourTotal +=
            eachPartData.challengeResults?.participantOutcome === Outcome.Win
              ? Number(eachPartData.participationValueQty)
              : 0
          unFavourTotal +=
            eachPartData.challengeResults?.participantOutcome === Outcome.Lose
              ? Number(eachPartData.participationValueQty)
              : 0
        }
      }

      if (
        (challengeResp.challengeMode === ChallengeMode.Group ||
          challengeResp.challengeMode === ChallengeMode.Partial) &&
        challengeResp.challengeDepth !== CategoryDepth.WeekPickem &&
        challengeResp.challengeDepth !== CategoryDepth.DayPickem
      ) {
        const winSidePct = favourTotal !== 0 ? tokenStakedQty / favourTotal : 0
        const loseSidePct = unFavourTotal !== 0 ? tokenStakedQty / unFavourTotal : 0
        const profit = isFavour ? unFavourTotal * winSidePct : favourTotal * loseSidePct
        participationObj.potentialReturn = tokenStakedQty + profit
        participationObj.profit = profit
      }

      let pickStatusFlag = false
      if (
        challengeResultId &&
        challengeResp?.pickem &&
        (challengeResp?.challengeDepth === CategoryDepth.DayPickem ||
          challengeResp?.challengeDepth === CategoryDepth.WeekPickem)
      ) {
        const lineupsCount = await pickemChallengeLineups.count({
          where: {
            challengeId: challengeResp.challengeId,
            challengeResultId: challengeResultId,
            pickStatus: Status.Active,
          },
        })
        const fltrQry: PrismaParams = {}
        if (challengeResp?.challengeDepth === CategoryDepth.DayPickem) {
          fltrQry.where = {
            gameStats: {
              path: ['startDate'],
              string_starts_with: challengeResp?.pickem,
            },
          }
        } else {
          const week = challengeResp?.pickem?.toLowerCase()?.split('week ')?.[1]
          if (week) {
            fltrQry.where = {
              gameStats: {
                path: ['week'],
                equals: parseInt(week),
              },
            }
          }
        }

        // Logic to get the total games in a challenge starts here
        let query: string = ''
        if (challengeResp?.challengeDepth === CategoryDepth.DayPickem && challengeResp?.pickem) {
          const dateOfDay = new Date(challengeResp?.pickem)
          const nextDay = new Date(dateOfDay)
          nextDay.setDate(dateOfDay.getDate() + 1)

          query = `sssd.start_date >= '${dateOfDay.toISOString()}' and sssd.start_date < '${nextDay.toISOString()}'`
        } else {
          const week = challengeResp?.pickem?.toLowerCase()?.split('week ')?.[1]
          query = `sssd.week_of_stage = ${parseInt(week)}`
        }
        const gamesInChallengeCount: Record<string, number>[] = await prismaClient.$queryRawUnsafe(`
        select count(distinct sssd.game_id)
        from sport.games g full outer join sport.sports_stage_status_data sssd on g.game_id = sssd.game_id 
        full outer join challenge.game_odds go2 on go2.game_id = g.game_id and go2.game_id = sssd.game_id
        where sssd.league_id = '${challengeResp.games.seasons.leagues?.leagueId}' and ${query} 
        and g.api_source_id = ${challengeResp.games.apiSourceId} and g.season_id = ${challengeResp.games.seasonId};`)
        // Logic to get the total games in a challenge ends here

        pickStatusFlag = lineupsCount === Number(gamesInChallengeCount[0]?.count) && participantStatP1 != null
      }
      return {
        challengeResp,
        challengeGroupId,
        challengeResultId,
        contracts,
        isCancellable,
        isCreator,
        pickStatusFlag,
        participantPosition,
        participantStatP1,
        participantStatP2,
        creatorParticipantStatP1,
        creatorParticipantStatP2,
        isFavorite: challengeResp?._count?.favorites > 0,
        initializerStats,
        ...participationObj,
      }
    }
    throw new Error('Invalid inviteCode')
  }

  public async getPickemChallengeLineups(inviteCode: string, challengeResultId: number): Promise<object> {
    const challengeData = await challenges.findFirst({
      where: {
        inviteCode,
      },
      select: {
        status: true,
        challengeId: true,
      },
    })
    if (!challengeData) throw new Error('Invalid inviteCode')
    const userMetrics = await challengeResults.findFirst({
      where: {
        challengeResultId,
      },
    })
    const filter = {
      challengeId: challengeData?.challengeId,
      challengeResultId,
      pickStatus: Status.Active,
    }
    const lineupResp = await pickemChallengeLineups.findMany({
      where: filter,
      include: {
        games: {
          select: {
            processingStatus: true,
          },
        },
        teams: {
          select: {
            apiTeamId: true,
            teamName: true,
          },
        },
      },
    })
    const lineupsCount = await pickemChallengeLineups.count({ where: filter })
    return { lineUps: { data: lineupResp, count: lineupsCount }, challengeStatus: challengeData?.status, userMetrics }
  }

  public async getUserChallenges(userId: string, { filter, sort, skip, take }: GetParams): Promise<ServiceResponse> {
    const queryObj: PrismaParams = {
      skip,
      take,
      where: {
        walletAddress: {
          userId: userId,
        },
      },
      include: {
        challenges: {
          include: {
            creator: {
              select: {
                nickname: true,
              },
            },
            teams: true,
            Players: true,
            games: {
              select: {
                data: true,
                seasons: {
                  select: {
                    leagues: {
                      select: {
                        leagueName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        challengeResults: {
          select: {
            category: true,
            groups: true,
            subgroups: true,
            participantStatP1: true,
            participantStatP2: true,
            participantOutcome: true,
            finalOutcome: true,
            _count: true,
          },
        },
      },
    }
    if (filter?.menu) {
      switch (filter?.menu?.equals?.toLowerCase()) {
        case Outcome.Win?.toLowerCase(): {
          queryObj.where = {
            ...queryObj.where,
            challenges: {
              status: ChallengeStatus.Completed,
            },
            challengeResults: {
              finalOutcome: {
                equals: prismaClient.challengeResults.fields.participantOutcome,
              },
            },
          }
          delete filter.menu
          break
        }
        case Outcome.Lose?.toLowerCase(): {
          queryObj.where = {
            ...queryObj.where,
            challenges: {
              status: ChallengeStatus.Completed,
            },
            challengeResults: {
              finalOutcome: {
                not: {
                  equals: prismaClient.challengeResults.fields.participantOutcome,
                },
              },
            },
          }
          delete filter.menu
          break
        }
        case ChallengeStatus.Cancelled?.toLowerCase(): {
          queryObj.where = {
            ...queryObj.where,
            challenges: {
              status: ChallengeStatus.Cancelled,
            },
          }
          delete filter.menu
          break
        }
        case 'upcoming': {
          queryObj.where = {
            ...queryObj.where,
            challenges: {
              status: { not: ChallengeStatus.Cancelled },
              startDate: {
                gt: new Date(),
              },
            },
          }
          delete filter.menu
          break
        }
        default: {
          delete filter.menu
        }
      }
    }
    if (filter) queryObj.where = { ...queryObj.where, ...filter }
    if (sort) queryObj.orderBy = sort
    const participantsData = await challengeParticipations.findMany(queryObj)
    const data: Record<string, string | number | boolean | object | undefined | null>[] = []
    for (const eachPartData of participantsData) {
      const participantsCount = await challengeParticipations.count({
        where: {
          challengeId: eachPartData.challengeId,
          status: Status.Active,
        },
      })
      data.push({ ...eachPartData, participantsCount })
    }
    const countQuery: PrismaParams = { where: queryObj.where }
    if (filter) countQuery.where = { ...countQuery.where, ...filter }
    const count = await challengeParticipations.count(countQuery)

    return { data, count }
  }

  public async getChallengeParticipants(
    inviteCode: string,
    { filter, sort, skip, take }: GetParams,
  ): Promise<ServiceResponse> {
    const challengeData = await challenges.findFirst({
      where: {
        inviteCode,
      },
      select: {
        challengeId: true,
      },
    })
    if (!challengeData) throw new Error('Invalid inviteCode')
    const queryObj: PrismaParams = {
      skip,
      take,
      where: {
        challengeId: challengeData?.challengeId,
      },
      select: {
        walletAddress: {
          select: {
            nickname: true,
            userId: true,
          },
        },
        createdAt: true,
        participationValueQty: true,
        participationValueUsd: true,
        participantInputQty: true,
        participantInputUsd: true,
        challengeResults: {
          select: {
            participantOutcome: true,
            category: true,
            groups: true,
            subgroups: true,
            participantStatP1: true,
          },
        },
        contracts: {
          include: {
            networks: true,
          },
        },
        challenges: {
          select: {
            teams: true,
            Players: true,
          },
        },
      },
    }
    if (filter) queryObj.where = { ...queryObj.where, ...filter }
    if (sort) queryObj.orderBy = sort
    const data = await challengeParticipations.findMany(queryObj)
    const countQuery: PrismaParams = {}
    if (filter) countQuery.where = { ...queryObj.where, ...filter }
    const count = await challengeParticipations.count(countQuery)
    return { data, count }
  }

  public async getChallengeLeaderboard(
    inviteCode: string,
    challengeResultId: number,
    { skip, take }: GetParams,
  ): Promise<ServiceResponse> {
    const challengeData = await challenges.findFirst({
      where: {
        inviteCode,
      },
      select: {
        challengeId: true,
      },
    })
    if (!challengeData) throw new Error('Invalid inviteCode')
    const include = {
      challengeParticipations: {
        select: {
          walletAddress: {
            select: {
              nickname: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    }
    const currentUserLeaderboard = await challengeResults.findFirst({
      where: {
        challengeId: challengeData?.challengeId,
        challengeResultId,
        challenge: {
          status: {
            in: [ChallengeStatus?.InProgress, ChallengeStatus?.Completed],
          },
        },
      },
      include,
    })
    const filter = {
      where: {
        challengeId: challengeData?.challengeId,
        challenge: {
          status: {
            in: [ChallengeStatus?.InProgress, ChallengeStatus?.Completed],
          },
        },
        NOT: {
          challengeResultId,
        },
      },
    }
    const othersLeaderboardData = await challengeResults.findMany({
      where: filter.where,
      skip,
      take,
      orderBy: {
        participantPosition: 'asc',
      },
      include,
    })
    const count = await challengeResults.count({ where: filter.where })
    return { data: { currentUserLeaderboard, othersLeaderboardData }, count }
  }

  public async getPublicChallenges(
    { filter, sort, skip, take }: GetParams,
    leagueId?: number,
    externalUserId?: string,
  ): Promise<ServiceResponse> {
    let userData: { userId?: string; walletAddress?: string } | null = {}

    const filterQuery: PrismaParams = {
      skip,
      take,
      include: {
        games: {
          select: {
            data: true,
            seasons: {
              select: {
                leagues: {
                  select: {
                    leagueName: true,
                    sports: {
                      select: {
                        sportName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        creator: {
          select: {
            nickname: true,
          },
        },
        challengeParticipations: {
          include: {
            contracts: {
              include: {
                networks: true,
              },
            },
          },
        },
        teams: true,
        Players: true,
        challengeResults: {
          select: {
            category: true,
            groups: true,
            subgroups: true,
            participantStatP1: true,
            participantStatP2: true,
            participantOutcome: true,
          },
        },
        _count: {
          select: {
            challengeParticipations: true,
          },
        },
      },
    }

    const chlngMode = filter?.challengeMode?.equals
    filterQuery.where = {
      challengeType: ChallengeType.Public,
    }
    const sportId = filter?.sportId?.equals
    if (sportId) {
      filterQuery.where = {
        ...filterQuery.where,
        sportId: parseInt(sportId),
      }
    }
    if (chlngMode) {
      filterQuery.where = {
        ...filterQuery.where,
        challengeMode: chlngMode,
      }
    }
    if (externalUserId) {
      userData = await users.findFirst({
        where: {
          externalUserId,
        },
        select: {
          userId: true,
          walletAddress: true,
        },
      })
      if (!userData) throw new Error(`User with externalUserId = ${externalUserId} not found`)
      filterQuery.where = {
        ...filterQuery.where,
        challengeParticipations: {
          none: {
            paidWalletAddress: userData.walletAddress,
          },
        },
      }
    }
    const cpGroupByWhere: Record<string, object> = {
      challenges: {
        OR: [
          {
            status: ChallengeStatus.Pending,
          },
          {
            status: ChallengeStatus.Ready,
          },
        ],
        challengeMode: chlngMode,
      },
    }
    if (leagueId) {
      filterQuery.where = {
        ...filterQuery.where,
        games: {
          seasons: {
            leagueId,
          },
        },
      }
      cpGroupByWhere.challenges = {
        ...cpGroupByWhere.challenges,
        games: {
          seasons: {
            leagueId,
          },
        },
      }
    }
    if (chlngMode === ChallengeMode?.OneVsOne) {
      filterQuery.where.OR = [
        {
          status: ChallengeStatus.Pending,
        },
      ]
    } else {
      const chlgGroup = await challengeParticipations.groupBy({
        by: ['challengeId'],
        where: cpGroupByWhere,
        having: {
          challengeId: {
            _count: {
              gte: 100,
            },
          },
        },
      })
      let challengesToExclude: number[] = []
      challengesToExclude = challengesToExclude.concat(
        chlgGroup.map(({ challengeId }: { challengeId: number }) => challengeId),
      )

      filterQuery.where = {
        ...filterQuery.where,
        OR: [
          {
            challengeMode: ChallengeMode.OneVsOne,
            status: ChallengeStatus.Pending,
          },
          {
            challengeMode: ChallengeMode.Group,
            status: ChallengeStatus.Pending,
          },
          {
            challengeMode: ChallengeMode.Group,
            status: ChallengeStatus.Ready,
          },
          {
            challengeMode: ChallengeMode.Partial,
            status: ChallengeStatus.Pending,
          },
          {
            challengeMode: ChallengeMode.Partial,
            status: ChallengeStatus.Ready,
          },
        ],
        challengeId: {
          notIn: challengesToExclude,
        },
      }
    }
    if (sort) filterQuery.orderBy = sort
    if (filter?.search && filter?.search?.contains) {
      const searchKey = filter?.search?.contains
      if (isNaN(searchKey)) {
        filterQuery.where = {
          ...filterQuery.where,
          challengeName: {
            contains: searchKey,
            mode: 'insensitive',
          },
        }
      } else {
        filterQuery.where = {
          ...filterQuery.where,
          AND: {
            OR: [
              {
                challengeName: {
                  contains: searchKey,
                  mode: 'insensitive',
                },
              },
              {
                challengeId: parseInt(searchKey),
              },
            ],
          },
        }
      }
    }
    if (filter?.token) {
      filterQuery.where = {
        ...filterQuery.where,
        challengeParticipations: {
          ...filterQuery.where?.challengeParticipations,
          some: {
            ...filterQuery.where?.challengeParticipations?.some,
            contractId: parseInt(filter?.token?.equals),
          },
        },
      }
    }
    const challengesList: object[] = []
    const publicChallenges = await challenges.findMany(filterQuery)
    for (const chlng of publicChallenges) {
      let odds = 0
      if (chlng.oddsFlag) {
        const chlngPartData = await challengeParticipations.findFirst({
          where: {
            challengeId: chlng.challengeId,
            walletAddress: {
              userId: chlng.creatorAccountId,
            },
          },
          select: {
            oddsFlag: true,
            participantOdds: true,
          },
        })
        odds =
          Number(chlngPartData?.oddsFlag ? chlngPartData.participantOdds : 0) *
          (userData.userId === chlng.creatorAccountId ? 1 : -1)
      }
      challengesList.push({ ...chlng, odds })
    }
    const count = await challenges.count({ where: filterQuery.where })
    return { data: challengesList, count }
  }

  public async getCategoriesInGame(gameId: number): Promise<object[]> {
    const gamedata = await games.findFirst({
      where: {
        gameId,
      },
      select: {
        seasons: {
          select: {
            leagues: {
              select: {
                sportId: true,
              },
            },
          },
        },
      },
    })
    if (!gamedata?.seasons.leagues?.sportId) throw new Error(`gameId = ${gameId} not found.`)
    const categories = await sportInCategory.findMany({
      where: {
        sportId: gamedata?.seasons.leagues?.sportId,
        category: {
          status: Status.Active,
        },
      },
      select: {
        category: true,
      },
    })
    return categories
  }

  public async getGroupsInCategory(categoryId: number, filter?: object): Promise<object[]> {
    const groups = await categoriesGroups.findMany({
      where: {
        categoryId,
        ...filter,
        groups: {
          status: Status.Active,
        },
      },
      select: {
        groups: true,
        depth: true,
      },
    })
    return groups
  }

  public async getSubgroupsInGroups(groupId: number): Promise<object[]> {
    const subgroups = await groupsSubgroups.findMany({
      where: {
        groupId,
        subGroups: {
          status: Status.Active,
        },
      },
      select: {
        subGroups: true,
      },
    })
    return subgroups
  }

  public async getNetworkByContract(payload: JoinChallengeForm): Promise<number> {
    if (payload && payload.challengeMode === ChallengeMode.OneVsOne) {
      const redisKey: string = REDIS_KEYS.CHALLENGES['1V1_JOIN_PENDING'].replace(
        '${challengeId}',
        payload.challengeId.toString(),
      )

      const isPaidWalletAddress = await getRedisKey(redisKey)
      if (isPaidWalletAddress) {
        throw new Error('Already a user is processing the challenge')
      }
      await setRedisKey(redisKey, payload.walletAddress, 300)
    }

    const contractData = await contracts.findFirst({
      where: {
        contractId: payload.contractId,
      },
      select: {
        networkId: true,
      },
    })

    if (!contractData) {
      throw new Error("Contract doesn't exist.")
    }
    return contractData.networkId
  }

  // Update Challenge Mode
  public async UpdateChallengeMode(
    payload: UpdateChallengeMode,
    headers: JsonObject,
    challengeId: string,
  ): Promise<Prisma.Challenges> {
    const challengeData = await challenges.findFirst({
      where: {
        challengeId: Number(challengeId),
      },
      select: {
        challengeId: true,
        challengeName: true,
        challengeMode: true,
        creatorAccountId: true,
      },
    })

    if (
      challengeData &&
      challengeData.challengeMode === ChallengeMode.OneVsOne &&
      payload?.creatorStakedQty &&
      payload?.creatorStakedQty >= partialStakeLimit
    ) {
      let eventName: string = ''

      switch (payload.shareStatus) {
        case ShareStatus.Sent:
          eventName = EVENTS.TRACKING.PARTIAL_BET_REQUEST_INITIATED
          break
        case ShareStatus.Approved:
        case ShareStatus.Rejected:
          eventName = EVENTS.TRACKING.PARTIAL_BET_REQUEST_DECIDED
          break
        case ShareStatus.Converted:
          eventName = EVENTS.TRACKING.BET_CONVERTED
          break
      }

      const kafkaMessage: IKafkaMessage = {
        key: headers['caller-id'],
        value: {
          eventName,
          data: {
            ...payload,
            challengeId: Number(challengeId),
          },
        },
      }

      producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, headers)
      const isConvertedAndValid =
        challengeData.creatorAccountId === headers['caller-id'] &&
        (payload.shareStatus === ShareStatus.Approved || payload.shareStatus === ShareStatus.Converted)
      const updateChallengeMode = await challenges.update({
        where: { challengeId: Number(challengeId) },
        data: {
          challengeMode: isConvertedAndValid ? ChallengeMode.Partial : undefined,
          shareStatus: payload.shareStatus,
          challengeName: isConvertedAndValid
            ? challengeData.challengeName.replace(ChallengeFormat.OneVOne, ChallengeFormat.OneVGroup)
            : undefined,
        },
      })
      return updateChallengeMode
    } else {
      throw 'Invalid Payload'
    }
  }

  // Get partial bet events
  public async getPartialBetEvents(userId: string, queryParam: JsonObject): Promise<JsonObject> {
    let partialEvents: JsonObject[] = []

    if (queryParam.sharestatus === ShareStatus.Sent) {
      const query = `select users.nickname, ch.challenge_id as "challengeId", ch.challenge_name as "challengeName", ch.invite_code as "inviteCode",
                      ev.data->>'shareStatus' as "shareStatus", ev.created_at as "createdAt", ev.event_name as "eventName", ch.challenge_mode as "challengeMode",
                      ch.start_date as "startDate", ch.challenge_depth as "challengeDepth", sports.sport_name as "sportName",
                      (SELECT MIN(cp.participation_value_qty) 
                          from challenge.challenge_participations cp 
                          where cp.challenge_id = ch.challenge_id
                      ) as "participationValueQty"
                      from challenge.challenges ch
                      join "user".events ev on ch.challenge_id = (ev.data->>'challengeId')::int
                      join "user".users on ev.user_id = users.user_id
                      join sport.sports on sports.sport_id = ch.sport_id
                      where ch.creator_account_id = '${userId}' and ch.share_status IS NOT NULL 
                      and ev.event_name = '${EVENTS.TRACKING.PARTIAL_BET_REQUEST_INITIATED}' 
                      and NOT EXISTS (
                        SELECT 1 FROM "user".events ev2
                            where ev2.data->>'challengeId' = ev.data->>'challengeId'
                              and ev2.event_name in ('${EVENTS.TRACKING.PARTIAL_BET_REQUEST_DECIDED}', '${EVENTS.TRACKING.BET_CONVERTED}')
                        )
                      order by ev.created_at desc`

      partialEvents = await prismaClient.$queryRawUnsafe(query)
    }
    return partialEvents
  }
}
