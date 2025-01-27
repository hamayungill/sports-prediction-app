import prismaClient, { Prisma } from '@duelnow/database'
import { removeRedisKey } from '@duelnow/redis'
import {
  CancelReasonCode,
  CreateChallenge,
  GetParams,
  JoinChallenge,
  PrismaParams,
  REDIS_KEYS,
  SmartContractResponse,
  UpdateChallengeType,
  UpdateTiebreaker,
  UpsertFavorites,
  UpsertLineups,
  UpstakeTokenQty,
  generateCode,
} from '@duelnow/utils'
import { JsonObject } from 'swagger-ui-express'

import { ChallengesService } from './challenges'
import {
  Category,
  ChallengeFormat,
  Pickem,
  cancelChallengeError,
  challengeIdError,
  createChallengeError,
  inviteCodeLength,
  joinChallengeError,
  overUnderError,
  picksError,
  upsertLineupError,
  winCriteriaError,
} from '../utils/const'
import {
  ChallengeResultsData,
  ChallengesInclude,
  ServiceResponse,
  challengeParticipationsInclude,
} from '../utils/types'

const {
  ChallengeMode,
  CategoryDepth,
  ChallengeStatus,
  ChallengeParticipationStatus,
  CdfEvent,
  Outcome,
  ShareStatus,
  Status,
  TxnStatus,
} = Prisma

const {
  betOdds,
  sports,
  categories,
  challenges,
  challengeResults,
  challengeParticipations,
  contractDataFeed,
  challengeGroupParticipants,
  favorites,
  pickemChallengeLineups,
  challengeGroups,
  teams,
  players,
} = prismaClient

export class SportsService {
  // createChallenge
  public async createChallenge(payload: CreateChallenge): Promise<ChallengesInclude> {
    if (new Date(payload.startDate) < new Date()) throw createChallengeError
    let challengeName: string
    let categoriesData: JsonObject | null = null
    let teamsData: JsonObject | null = null
    let playersData: JsonObject | null = null
    const date = new Date(payload.startDate)
    const scheduledStartDateFormat = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
    let challengeMode

    if (payload?.categoryId) {
      categoriesData = await categories.findFirst({
        where: {
          categoryId: payload.categoryId,
        },
        select: {
          categoryApiTitle: true,
        },
      })

      if (categoriesData?.categoryApiTitle.toLowerCase() === Category.OverUnder) {
        if (Number(payload.participantStatP1) < 0.5) {
          throw overUnderError
        }
      }
    }

    if (payload.challengeMode === ChallengeMode.OneVsOne) {
      challengeMode = ChallengeFormat.OneVOne
    } else if (payload.challengeMode === ChallengeMode.Group) {
      challengeMode = ChallengeFormat.Group
    } else if (payload.challengeMode === ChallengeMode.Partial) {
      challengeMode = ChallengeFormat.OneVGroup
    }
    switch (payload.gameType) {
      case CategoryDepth.DayPickem:
        if (!payload?.winCriteria || payload?.winCriteria < 1 || payload?.winCriteria > 3) throw winCriteriaError
        challengeName = `${payload.leagueName.toUpperCase()} ${Pickem.Day} - ${payload.pickem}`
        break

      case CategoryDepth.WeekPickem:
        if (!payload?.winCriteria || payload?.winCriteria < 1 || payload?.winCriteria > 3) throw winCriteriaError
        challengeName = `${payload.leagueName.toUpperCase()} ${Pickem.Week} - ${payload.pickem?.toUpperCase()}`
        break

      case CategoryDepth.Game:
        challengeName = `${challengeMode}-Game Challenge ${payload.homeAbbreviation}_Home vs ${payload.awayAbbreviation}_Away ${scheduledStartDateFormat}`
        break

      case CategoryDepth.Team:
        challengeName = `${challengeMode}-Team Challenge`
        break

      case CategoryDepth.Player:
        challengeName = `${challengeMode}-Player Challenge ${scheduledStartDateFormat}`
        break

      default:
        challengeName = ''
        break
    }

    const inviteCode = await this.getInviteCode()

    const challengeGroupData = await challengeGroups.create({
      data: {
        challengeGroupParticipants: {
          create: {
            userId: payload.creatorAccountId,
          },
        },
      },
    })

    if (payload.teamId) {
      teamsData = await teams.findFirst({
        where: {
          sportId: payload.sportId,
          apiTeamId: payload.teamId,
          status: Status.Active,
        },
        select: {
          teamId: true,
        },
      })
    }

    if (payload.playerId) {
      playersData = await players.findFirst({
        where: {
          sportId: payload.sportId,
          apiPlayerId: payload.playerId,
          isActive: true,
        },
        select: {
          playerId: true,
        },
      })
    }

    const createChallengeData = await challenges.create({
      data: {
        challengeName,
        inviteCode,
        creatorAccountId: payload.creatorAccountId,
        challengeMode: payload.challengeMode,
        challengeType: payload.challengeType,
        gameId: payload.gameId,
        teamId: teamsData?.teamId || null,
        sportId: payload.sportId,
        playerId: playersData?.playerId || null,
        oddsFlag: payload.oddsFlag,
        multiTokenFlag: payload.multiTokenFlag,
        challengeValueQty: payload.challengeValueQty,
        challengeValueUsd: payload.challengeValueQty * payload.exchangeRate,
        status: ChallengeStatus.AuthPending,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        challengeDepth: payload.gameType,
        pickem: payload.pickem || null,
        processingStatus: TxnStatus.Pending,
        contractId: payload.scContractId,
        pickemScoreMode: payload.pickemScoreMode || null,
        challengeParticipations: {
          create: {
            challengeGroupId: challengeGroupData.challengeGroupId,
            paidWalletAddress: payload.paidWalletAddress,
            oddsFlag: payload.oddsFlag,
            participantOdds: payload.participantOdds,
            multiTokenFlag: payload.multiTokenFlag,
            contractId: payload.contractId,
            exchangeRate: payload.exchangeRate,
            participationValueQty: payload.challengeValueQty,
            participationValueUsd: payload.challengeValueQty * payload.exchangeRate,
            participantInputQty: payload.participantInputQty || 0,
            participantInputUsd: payload.participantInputQty || 0 * payload.exchangeRate,
            challengeDepth: payload.gameType,
            participantRole: payload.participantRole,
            status: ChallengeParticipationStatus.Inactive,
          },
        },
        challengeResults: {
          create: {
            sportId: payload.sportId,
            categoryId: payload.categoryId,
            groupId: payload.groupId,
            subgroupId: payload.subgroupId,
            participantStatP1: payload.participantStatP1,
            participantStatP2: payload.participantStatP2,
            statAttribute: payload.statAttribute,
            participantOutcome: payload.participantOutcome,
            winCriteria: payload.winCriteria,
          },
        },
        contractDataFeed: {
          create: {
            walletAddress: payload.paidWalletAddress,
            participantOutcome: payload.participantOutcome,
            contractId: payload.contractId,
            tokenStakedQty: payload.challengeValueQty,
            transactionHash: payload.transactionHash,
            event: CdfEvent.Create,
            status: TxnStatus.Pending,
          },
        },
      },
      include: {
        sport: {
          select: {
            sportName: true,
          },
        },
        challengeResults: {
          select: {
            category: {
              select: {
                categoryApiTitle: true,
              },
            },
            participantOutcome: true,
          },
        },
        challengeParticipations: {
          select: {
            contracts: {
              select: {
                tokenName: true,
                networks: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    const challengeResultsData: ChallengeResultsData | null = await challengeResults.findFirst({
      where: {
        challengeId: createChallengeData.challengeId,
      },
      select: {
        challengeResultId: true,
      },
    })

    if (challengeResultsData) {
      await challengeParticipations.updateMany({
        where: {
          challengeId: createChallengeData.challengeId,
        },
        data: {
          challengeResultId: challengeResultsData.challengeResultId,
        },
      })
    }

    return createChallengeData
  }

  // Join Challenge
  public async joinChallenge(payload: JoinChallenge, challengeId: number): Promise<challengeParticipationsInclude> {
    const challengeData: JsonObject | null = await challenges.findUnique({
      where: {
        challengeId: challengeId,
      },
      select: {
        startDate: true,
        challengeMode: true,
        shareStatus: true,
        challengeResults: {
          select: {
            sportId: true,
            winCriteria: true,
          },
        },
      },
    })

    if (challengeData && challengeData.challengeMode === ChallengeMode.OneVsOne) {
      if (challengeData.challengeResults.length > 1) {
        throw new Error('Maximum number of participants has joined')
      }

      if (challengeData.shareStatus === ShareStatus.Sent) {
        await challenges.update({
          where: {
            challengeId,
            shareStatus: ShareStatus.Sent,
          },
          data: {
            shareStatus: ShareStatus.Cancelled,
          },
        })
      }
    }

    if (challengeData && new Date(challengeData.startDate) < new Date()) throw joinChallengeError

    const joinChallengeData = challengeParticipations.create({
      data: {
        oddsFlag: payload.oddsFlag,
        participantOdds: payload.participantOdds,
        multiTokenFlag: payload.multiTokenFlag,
        exchangeRate: payload.exchangeRate,
        participationValueQty: payload.participationValueQty,
        participationValueUsd: payload.participationValueQty * payload.exchangeRate,
        participantInputQty: payload.participantInputQty || 0,
        participantInputUsd: payload.participantInputQty || 0 * payload.exchangeRate,
        challengeDepth: payload.gameType,
        participantRole: payload.participantRole,
        status: ChallengeParticipationStatus.Inactive,
        challenges: { connect: { challengeId: challengeId } },
        challengeGroups: { connect: { challengeGroupId: payload.challengeGroupId } },
        walletAddress: { connect: { walletAddress: payload.paidWalletAddress } },
        contracts: { connect: { contractId: payload.contractId } },
      },
      include: {
        contracts: {
          select: {
            tokenName: true,
            networks: {
              select: {
                name: true,
              },
            },
          },
        },
        challenges: {
          select: {
            sport: {
              select: {
                sportName: true,
              },
            },
            challengeMode: true,
            challengeType: true,
          },
        },
        challengeResults: {
          select: {
            category: {
              select: {
                categoryApiTitle: true,
              },
            },
            participantOutcome: true,
          },
        },
      },
    })
    const addContractDataFeed = contractDataFeed.create({
      data: {
        challengeId: challengeId,
        walletAddress: payload.paidWalletAddress,
        participantOutcome: payload.participantOutcome,
        contractId: payload.contractId,
        tokenStakedQty: payload.participationValueQty,
        scChallengeId: payload.scChallengeId,
        transactionHash: payload.transactionHash,
        event: CdfEvent.Join,
        status: TxnStatus.Pending,
      },
    })

    const challengeResultsData = challengeResults.create({
      data: {
        challengeId: challengeId,
        sportId: challengeData?.challengeResults[0]?.sportId || null,
        categoryId: payload.categoryId,
        groupId: payload.groupId,
        subgroupId: payload.subgroupId,
        winCriteria: challengeData ? challengeData.challengeResults[0].winCriteria : 0,
        participantStatP1: payload.participantStatP1,
        participantStatP2: payload.participantStatP2,
        statAttribute: payload.statAttribute,
        participantOutcome: payload.participantOutcome,
      },
    })

    const challengeGroupParticipantsData = challengeGroupParticipants.create({
      data: {
        challengeGroupId: payload.challengeGroupId,
        userId: payload.participantAccountId,
      },
    })

    const result = await prismaClient.$transaction([
      joinChallengeData,
      challengeResultsData,
      addContractDataFeed,
      challengeGroupParticipantsData,
    ])

    await challengeParticipations.updateMany({
      where: {
        participationId: result[0].participationId,
        challengeId,
      },
      data: {
        challengeResultId: result[1].challengeResultId,
      },
    })

    return result[0]
  }

  // Pickem Challenge Lineups
  public async upsertLineups(payload: UpsertLineups): Promise<object> {
    const challengeData: JsonObject | null = await challenges.findUnique({
      where: {
        challengeId: payload.challengeId,
      },
      select: {
        inviteCode: true,
        startDate: true,
      },
    })

    if (challengeData) {
      if (new Date(challengeData.startDate) < new Date()) throw picksError
      const teamsData = await teams.findFirst({
        where: {
          sportId: payload.sportId,
          apiTeamId: payload.pickTeamId,
          status: Status.Active,
        },
        select: {
          teamId: true,
        },
      })

      if (teamsData) {
        await pickemChallengeLineups.upsert({
          where: { id: payload.lineupId || 0 },
          update: {
            pickTeamId: teamsData.teamId,
            spreadPoints: payload.spreadPoints,
            gameId: payload.gameId,
            pickStatus: payload.pickStatus === Status.Active ? Status.Active : Status.Inactive,
          },
          create: {
            challengeId: payload.challengeId,
            challengeResultId: payload.challengeResultId,
            pickTeamId: teamsData.teamId,
            spreadPoints: payload.spreadPoints,
            gameId: payload.gameId,
            pickStatus: Status.Active,
          },
        })
        const lineupsData = await new ChallengesService().getPickemChallengeLineups(
          challengeData.inviteCode,
          payload.challengeResultId,
        )
        return lineupsData
      }
      throw upsertLineupError
    }
    throw challengeIdError
  }

  // Get Invite Code
  public async getInviteCode(): Promise<string> {
    let inviteCode: string
    let isExists
    do {
      inviteCode = await generateCode(inviteCodeLength)
      isExists = await challenges.findFirst({
        where: {
          inviteCode: inviteCode,
        },
        select: {
          inviteCode: true,
        },
      })
    } while (isExists)
    return inviteCode
  }
  public async getSports({ filter, sort, skip, take }: GetParams): Promise<ServiceResponse> {
    const queryObj: PrismaParams = {
      skip,
      take,
      include: {
        leagues: {
          where: {
            status: Status.Active,
          },
          orderBy: {
            status: 'asc',
          },
        },
      },
      where: {
        status: Status.Active,
      },
    }
    if (filter) queryObj.where = { ...queryObj.where, ...filter }
    if (sort) queryObj.orderBy = sort
    const data = await sports.findMany(queryObj)
    const countQuery: PrismaParams = {}
    if (filter) countQuery.where = filter
    const count = await sports.count(countQuery)
    return { data, count }
  }

  // Get Default Odds
  public async getDefaultOdds({ filter, sort, skip, take }: GetParams): Promise<ServiceResponse> {
    const queryObj: PrismaParams = {
      skip,
      take,
      where: {
        status: Status.Active,
      },
      include: {
        bookmakers: {
          select: {
            bookmakerName: true,
          },
        },
      },
    }

    if (filter) {
      if (filter.apiCategoryId) {
        filter.apiCategoryId.equals = filter.apiCategoryId.equals.toString()
      }
      if (filter.spreadVal) {
        filter.spreadVal.equals = filter.spreadVal.equals.toString()
      }
      queryObj.where = { ...queryObj.where, ...filter }
    }
    if (sort) queryObj.orderBy = sort
    const data = await betOdds.findMany(queryObj)
    const countQuery: PrismaParams = {}
    if (filter) countQuery.where = filter
    const count = await betOdds.count(countQuery)
    return { data, count }
  }

  // Update Pickem Tiebreaker
  public async updateTiebreaker(payload: UpdateTiebreaker): Promise<Prisma.ChallengeResults> {
    const updateTiebreaker = await challengeResults.update({
      where: { challengeResultId: payload.challengeResultId || 0 },
      data: {
        participantStatP1: payload.tiebreaker,
      },
    })
    return updateTiebreaker
  }

  // Update Challenge Type
  public async updateChallengeType(payload: UpdateChallengeType): Promise<Prisma.Challenges> {
    const updateChallengeType = await challenges.update({
      where: { challengeId: payload.challengeId || 0 },
      data: {
        challengeType: payload.challengeType,
      },
    })
    return updateChallengeType
  }

  // Update Smart Contract Response
  public async smartContractResponse(payload: SmartContractResponse): Promise<JsonObject[]> {
    const updateChallengeStatus = challenges.updateMany({
      where: {
        challengeId: payload.challengeId,
        status: ChallengeStatus.AuthPending,
      },
      data: {
        scChallengeId: payload.scChallengeId,
        status: payload.isScFailed ? ChallengeStatus.Cancelled : ChallengeStatus.Pending,
      },
    })

    const updateParticipantStatus = challengeParticipations.updateMany({
      where: {
        challengeId: payload.challengeId,
        paidWalletAddress: payload.walletAddress,
        status: ChallengeParticipationStatus.Inactive,
      },
      data: {
        status: payload.isScFailed ? ChallengeParticipationStatus.Inactive : ChallengeParticipationStatus.Active,
      },
    })

    const updateContractDataFeed = contractDataFeed.updateMany({
      where: {
        challengeId: payload.challengeId,
        transactionHash: payload.transactionHash,
      },
      data: {
        scChallengeId: payload.scChallengeId,
        status: payload.isScFailed ? TxnStatus.Failed : TxnStatus.Success,
      },
    })

    const result = await prismaClient.$transaction([
      updateChallengeStatus,
      updateParticipantStatus,
      updateContractDataFeed,
    ])

    if (!payload.isScFailed && payload.isJoin) {
      const challengeValueQty =
        (payload.challengeValueQty ? Number(payload.challengeValueQty) : 0) + Number(payload.participationValueQty)
      await challenges.update({
        where: {
          challengeId: payload.challengeId,
        },
        data: {
          challengeValueQty,
          challengeValueUsd: challengeValueQty * Number(payload.exchangeRate),
          status: payload.isReadyState ? ChallengeStatus.Ready : undefined,
        },
      })
    }
    return result
  }

  // Cancel Challenge
  public async cancelChallenge(challengeId: number): Promise<JsonObject[]> {
    let result: JsonObject[] = []
    const challengeData = await challenges.findUnique({
      where: {
        challengeId,
      },
      select: {
        scChallengeId: true,
        startDate: true,
        status: true,
        contractId: true,
        challengeParticipations: {
          select: {
            participationId: true,
          },
        },
      },
    })
    if (challengeData) {
      if (
        challengeData.challengeParticipations.length === 1 &&
        new Date(challengeData.startDate) > new Date() &&
        challengeData.status === ChallengeStatus.Pending
      ) {
        const insertContractDataFeed = contractDataFeed.create({
          data: {
            challengeId,
            scChallengeId: challengeData.scChallengeId,
            contractId: challengeData.contractId,
            event: CdfEvent.CancelledOrDraw,
            finalOutcome: Outcome.CancelledOrDraw,
            status: TxnStatus.Pending,
          },
        })

        const challengesStatus = challenges.update({
          where: {
            challengeId,
          },
          data: {
            status: ChallengeStatus.Cancelled,
            finalOutcome: Outcome.CancelledOrDraw,
            reasonCode: CancelReasonCode.UserCancellation,
            processingStatus: TxnStatus.InProgress,
          },
          include: {
            sport: {
              select: {
                sportName: true,
              },
            },
            challengeParticipations: {
              select: {
                walletAddress: {
                  select: {
                    userId: true,
                  },
                },
                contracts: {
                  select: {
                    tokenName: true,
                    networks: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
                participationValueQty: true,
                participationValueUsd: true,
                challengeDepth: true,
                challengeResults: {
                  select: {
                    category: {
                      select: {
                        categoryApiTitle: true,
                      },
                    },
                    participantOutcome: true,
                  },
                },
              },
            },
          },
        })

        const updateChallengeParticipationsStatus = challengeParticipations.updateMany({
          where: {
            challengeId,
          },
          data: {
            status: ChallengeParticipationStatus.Inactive,
          },
        })

        const updateChallengeResults = challengeResults.updateMany({
          where: {
            challengeId,
          },
          data: {
            finalOutcome: Outcome.CancelledOrDraw,
          },
        })
        result = await prismaClient.$transaction([
          insertContractDataFeed,
          challengesStatus,
          updateChallengeParticipationsStatus,
          updateChallengeResults,
        ])
      } else {
        throw cancelChallengeError
      }
    }
    return result
  }

  // get favorites
  public async getFavorites(userId: string, { filter, sort, skip, take }: GetParams): Promise<ServiceResponse> {
    const contractFilter: JsonObject = {}
    if (filter && filter?.sportId) {
      filter.sportId.equals = Number(filter?.sportId?.equals)
    }
    if (filter && filter?.contractId) {
      contractFilter.challengeParticipations = {
        some: {
          contractId: Number(filter?.contractId?.equals),
        },
      }
      delete filter?.contractId
    }

    const queryObj: PrismaParams = {
      skip,
      take,
      where: {
        favorites: {
          some: {
            isFavorite: true,
            userId,
          },
        },
      },
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
        challengeResults: {
          select: {
            challengeResultId: true,
            category: true,
            groups: true,
            subgroups: true,
            participantOutcome: true,
            participantStatP1: true,
            participantStatP2: true,
            challengeParticipations: {
              select: {
                contractId: true,
                participantOdds: true,
                walletAddress: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    }

    if (filter) queryObj.where = { ...queryObj.where, ...filter, ...contractFilter }
    if (sort) queryObj.orderBy = sort

    const favoritesData = await challenges.findMany(queryObj)
    const countQuery: PrismaParams = {}

    if (filter) countQuery.where = { ...queryObj.where, ...filter, ...contractFilter }
    const count = await challenges.count(countQuery)

    return { data: favoritesData, count }
  }

  // update favorites
  public async updateFavorites(headers: JsonObject, payload: UpsertFavorites): Promise<Prisma.Favorites> {
    const updateFavoritesData = await favorites.upsert({
      where: {
        userId_challengeId: {
          userId: headers['caller-id'],
          challengeId: payload.challengeId,
        },
      },
      update: {
        isFavorite: payload.isFavorite,
      },
      create: {
        challengeId: payload.challengeId,
        userId: headers['caller-id'],
        isFavorite: payload.isFavorite,
      },
    })

    return updateFavoritesData
  }

  // Upstake Token Qty
  public async upstakeTokenQty(payload: UpstakeTokenQty): Promise<JsonObject[]> {
    const challengeParticipantData = await challengeParticipations.findFirst({
      where: {
        challengeId: payload.challengeId,
        paidWalletAddress: payload.walletAddress,
      },
      select: {
        participationValueQty: true,
      },
    })

    if (challengeParticipantData && payload.tokenUpstakeQty > 0) {
      const updateChallParticipation = challengeParticipations.updateMany({
        where: {
          challengeId: payload.challengeId,
          paidWalletAddress: payload.walletAddress,
        },
        data: {
          participationValueQty: Number(challengeParticipantData.participationValueQty) + payload.tokenUpstakeQty,
        },
      })

      const createCDF = contractDataFeed.create({
        data: {
          challengeId: payload.challengeId,
          walletAddress: payload.walletAddress,
          contractId: payload.contractId,
          scChallengeId: payload.scChallengeId,
          tokenStakedQty: payload.tokenUpstakeQty,
          event: CdfEvent.Upstake,
          status: TxnStatus.Success,
        },
      })

      const result = await prismaClient.$transaction([updateChallParticipation, createCDF])
      return result
    }
    throw new Error('Invalid payload')
  }

  // Get Potential Returns
  public async getPotentialReturns({ filter }: GetParams): Promise<JsonObject | null> {
    if (filter && filter.stakeQty.equals <= 0) throw 'Stake quantity must be greater than 0'
    let profit: number | null = 0
    let potentialReturns: number | null = 0
    let winningSideTotalToken: number = 0
    let losingSideTotalToken: number = 0
    let winSidePct: number = 0
    let loseSidePct: number = 0
    const queryObj: PrismaParams = {
      select: {
        participationValueQty: true,
        challengeResults: {
          select: {
            participantOutcome: true,
          },
        },
      },
    }
    if (filter) {
      const stakeQty = filter.stakeQty.equals || 0
      const usersChoice =
        filter.participantOutcome.equals.charAt(0).toUpperCase() + filter.participantOutcome.equals.slice(1)
      delete filter.stakeQty
      delete filter.participantOutcome
      queryObj.where = filter
      const potentialReturnsData: JsonObject = await challengeParticipations.findMany(queryObj)
      potentialReturnsData?.forEach((data: JsonObject) => {
        if (data.challengeResults.participantOutcome === Outcome.Win) {
          winningSideTotalToken += Number(data.participationValueQty)
        } else if (data.challengeResults.participantOutcome === Outcome.Lose) {
          losingSideTotalToken += Number(data.participationValueQty)
        }
      })
      winSidePct = stakeQty / (winningSideTotalToken + stakeQty)
      loseSidePct = stakeQty / (losingSideTotalToken + stakeQty)

      if (usersChoice === Outcome.Win) {
        profit = losingSideTotalToken * winSidePct
        potentialReturns = stakeQty + profit
      }

      if (usersChoice === Outcome.Lose) {
        profit = winningSideTotalToken * loseSidePct
        potentialReturns = stakeQty + profit
      }
    }
    return { profit, potentialReturns }
  }

  public async removeJoinRedisKey(challengeId: number): Promise<void> {
    const redisKey: string = REDIS_KEYS.CHALLENGES['1V1_JOIN_PENDING'].replace('${challengeId}', challengeId.toString())

    await removeRedisKey(redisKey)
  }

  public async getLeagues(): Promise<JsonObject> {
    let result: JsonObject = []
    const sportsData: JsonObject = await sports.findMany({
      select: {
        sportId: true,
        sportName: true,
      },
    })

    if (sportsData && sportsData.length > 0) {
      const sportsObject: JsonObject = sportsData.reduce((acc: JsonObject, current: JsonObject) => {
        acc[current.sportName] = current.sportId
        return acc
      }, {})

      if (sportsObject) {
        const query: string = `
            select sport_id,league_id,league from 
                (select active_leagues.league_id, active_leagues.league_name league,active_leagues.sport_id from
                (select distinct data ->> 'category' league ,sport_id 
                  from sport.games where sport_id in (${sportsObject['MMA']}) and data ->> 'status'='Scheduled'
                union
                  select  distinct case when data ->> 'league'='standard' then 'NBA' when data ->> 'league'<>'standard'then data ->> 'league' end league ,sport_id
                    from sport.games where sport_id in (${sportsObject['Basketball']}) and data ->> 'status'='Scheduled'
                union
                  select distinct data -> 'league' ->> 'name' league ,sport_id
                    from sport.games where sport_id in (${sportsObject['Baseball']},${sportsObject['Football']}) and data ->> 'status'='Scheduled') as game_leagues,
                  (
                    select league_name,sport_id, league_id  from sport.leagues l where status='Active' and sport_id <> ${sportsObject['Soccer']}) as active_leagues
                      where active_leagues.league_name=game_leagues.league) other_leagues
                  union
                    select sport_id,league_id,league from 
                      (select l.league_id, l.league_name league,l.sport_id
                        from ( select  distinct data ->> 'league' league ,sport_id
                          from sport.games where sport_id in (${sportsObject['Soccer']}) and data ->> 'status'='Scheduled'
                              ) sl ,sport.leagues l
                        where substring(l.league_name,1,position('(' in l.league_name)-2)=sl.league 
                        and l.sport_id = ${sportsObject['Soccer']} and l."status" ='Active') soccer_leagues order by sport_id`

        result = await prismaClient.$queryRawUnsafe(query)
      }
    }
    return result
  }
}
