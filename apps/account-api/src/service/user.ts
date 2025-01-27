import prismaClient, { Prisma } from '@duelnow/database'
import { GetParams, PrismaParams, UserPreference, generateCode } from '@duelnow/utils'
import { createMerkleTree, generateProof } from '@duelnow/web3'
import { JsonObject } from 'swagger-ui-express'

import { logger, nickname } from '../utils'
import { UserCreationModel, UsersResponse } from '../utils/types'

const { users, preferences, userPreferences, waitlist } = prismaClient

export class UsersService {
  public async getUserByExternalUserId(id: string): Promise<JsonObject | null> {
    const userInfo = await users.findFirst({
      where: {
        externalUserId: id,
      },
      include: {
        UserRoles: true,
        membershipLevel: {
          select: {
            levelId: true,
            feeDeductionPct: true,
          },
        },
        referrer: {
          select: {
            walletAddress: true,
            membershipLevel: {
              select: {
                referralBonusPct: true,
              },
            },
          },
        },
      },
    })
    return userInfo
  }

  public async getUserByWalletAddress(id: string): Promise<Prisma.Users | null> {
    const userInfo = await users.findFirst({
      where: {
        walletAddress: id,
      },
      include: {
        UserRoles: true,
      },
    })
    return userInfo
  }

  public async getUserByID(id: string, select?: object): Promise<JsonObject | null> {
    let proof: string[] | null = []
    const queryObj: PrismaParams = {
      where: {
        userId: id,
      },
      include: {
        UserRoles: true,
        membershipLevel: {
          select: {
            levelId: true,
            feeDeductionPct: true,
          },
        },
        referrer: {
          select: {
            walletAddress: true,
            membershipLevel: {
              select: {
                referralBonusPct: true,
              },
            },
          },
        },
      },
    }
    if (select && Object.keys(select).length) {
      delete queryObj.include
      queryObj.select = select
    }
    const userInfo = await users.findFirst(queryObj)
    if (userInfo && userInfo?.walletAddress) {
      proof = await generateProof(userInfo?.walletAddress)
      return { ...userInfo, proof }
    }
    return userInfo
  }

  public async getUserByEmail(email: string): Promise<Prisma.Users | null> {
    const userInfo = await users.findFirst({
      where: {
        email,
      },
      include: {
        UserRoles: true,
      },
    })
    return userInfo
  }

  public async getUserByNickname(nickname: string): Promise<Prisma.Users | null> {
    const userInfo = await users.findFirst({
      where: {
        nickname: {
          equals: nickname,
          mode: 'insensitive',
        },
      },
    })
    return userInfo
  }

  public async getUsers({ filter, sort, skip, take }: GetParams): Promise<UsersResponse> {
    const queryObj: PrismaParams = {
      skip,
      take,
      include: {
        UserRoles: true,
        membershipLevel: {
          select: {
            levelId: true,
            feeDeductionPct: true,
          },
        },
        referrer: {
          select: {
            walletAddress: true,
            membershipLevel: {
              select: {
                referralBonusPct: true,
              },
            },
          },
        },
      },
    }
    if (filter) queryObj.where = filter
    if (sort) queryObj.orderBy = sort
    const usersData = await users.findMany(queryObj)
    const countQuery: PrismaParams = {}
    if (filter) countQuery.where = filter
    const count = await users.count(countQuery)
    return { users: usersData, count }
  }

  public async create(userCreationParams: UserCreationModel): Promise<Prisma.Users> {
    const existingUser = await users.findFirst({
      where: {
        OR: [
          {
            walletAddress: userCreationParams.walletAddress,
          },
          {
            externalUserId: userCreationParams.externalUserId,
          },
        ],
      },
      select: {
        walletAddress: true,
        externalUserId: true,
      },
    })
    if (existingUser)
      throw new Error(
        // prettier-ignore
        `User with ${existingUser?.walletAddress === userCreationParams.walletAddress ? 'walletAddress' : 'externalUserId'
        } already exists.`,
      )

    let uniqueNickname
    if (!userCreationParams.nickname) {
      uniqueNickname = nickname()
    } else {
      uniqueNickname = userCreationParams.nickname
    }
    const userNicknameDetails = await users.findFirst({
      where: {
        nickname: uniqueNickname,
      },
      select: {
        nickname: true,
      },
    })

    if (!userCreationParams.nickname && userNicknameDetails && userNicknameDetails?.nickname === uniqueNickname) {
      uniqueNickname = nickname()
    }

    let uniqueReferralCode = generateCode(6).toUpperCase()
    const referralCodeDetails = await users.findFirst({
      where: {
        referralCode: uniqueReferralCode,
      },
      select: {
        referralCode: true,
      },
    })

    if (referralCodeDetails?.referralCode === uniqueReferralCode) {
      uniqueReferralCode = generateCode(6).toUpperCase()
    }
    let referrerCodeData: Record<string, string | null> | null = {}
    if (userCreationParams?.referrerCode) {
      referrerCodeData = await users.findFirst({
        where: {
          referralCode: userCreationParams.referrerCode,
        },
        select: {
          userId: true,
        },
      })
      if (!referrerCodeData) throw new Error(`Invalid referrerCode!`)
    }
    const userCreateResp = await users.create({
      data: {
        externalUserId: userCreationParams.externalUserId,
        email: userCreationParams.email,
        walletAddress: userCreationParams.walletAddress,
        firstName: userCreationParams.firstName,
        lastName: userCreationParams.lastName,
        isEmailVerified: userCreationParams.isEmailVerified,
        referrerUserId: referrerCodeData?.userId,
        nickname: uniqueNickname,
        handle: uniqueReferralCode,
        referralCode: uniqueReferralCode,
        UserRoles: {
          create: {
            role: {
              connect: {
                roleName: 'user',
              },
            },
          },
        },
      },
      include: {
        UserRoles: true,
        membershipLevel: {
          select: {
            levelId: true,
            feeDeductionPct: true,
          },
        },
        referrer: {
          select: {
            walletAddress: true,
            membershipLevel: {
              select: {
                referralBonusPct: true,
              },
            },
          },
        },
      },
    })

    await createMerkleTree([userCreationParams.walletAddress])
    return userCreateResp
  }

  public async updateUserById(userId: string, userData: object): Promise<Prisma.Users | null> {
    const userInfo = await users.update({
      where: {
        userId: userId,
      },
      data: {
        ...userData,
      },
    })
    return userInfo
  }

  public async updateUserPreference(
    userId: string,
    preferences: UserPreference[],
  ): Promise<{
    updatedPreference: UserPreference[]
    failedPreferences: UserPreference[]
  } | null> {
    const updatedPreference: UserPreference[] = []
    const failedPreferences: UserPreference[] = []
    for (const preference of preferences) {
      const { preferenceId, preferenceValue: value } = preference
      try {
        await userPreferences.upsert({
          where: {
            userId_preferenceId: {
              userId,
              preferenceId,
            },
          },
          create: {
            userId: userId,
            preferenceId: preferenceId,
            value,
          },
          update: {
            value,
          },
        })
        updatedPreference.push(preference)
      } catch (error) {
        logger.error(`Failed to upsert preference with ID ${preferenceId} for user ${userId}:`, error)
        failedPreferences.push(preference)
      }
    }
    return { updatedPreference, failedPreferences }
  }

  public async getPreferences(userId: string): Promise<Record<string, unknown>[]> {
    const preferencesData = await preferences.findMany({
      select: {
        preferenceId: true,
        name: true,
        value: true,
        UserPreferences: {
          where: {
            userId,
          },
          select: {
            value: true,
          },
        },
      },
    })
    // Transform the data to include UserSelectedPreferences
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedPreferences = preferencesData.map((preference: any) => {
      const { UserPreferences, preferenceId, name, value } = preference
      const userSelectedPreference = UserPreferences.length > 0 ? UserPreferences[0].value : null
      return {
        preferenceId: preferenceId,
        name: name,
        value: value,
        userSelectedPreference,
      }
    })

    return transformedPreferences
  }

  public async getWaitlistInviteCodeInfo(inviteCode: string): Promise<Prisma.Waitlist | null> {
    const waitlistInfo = await waitlist.findFirst({
      where: {
        inviteCode,
      },
    })
    return waitlistInfo
  }

  public async getUserByHandle(handle: string): Promise<Prisma.Users | null> {
    const userHandleInfo = await users.findFirst({
      where: {
        handle: {
          equals: handle,
          mode: 'insensitive',
        },
      },
    })
    return userHandleInfo
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getReferralStats(userId: string, filter: any): Promise<JsonObject> {
    const totalReferralCommision: JsonObject = {}
    let filterQuery: string = ''
    let dateFilter: object = {}
    const today: Date = new Date()
    const date = today.toISOString().split('T')[0]
    if (filter && filter !== '') {
      switch (filter) {
        case 'today':
          filterQuery = `and sct.created_at::date = '${date}'`
          dateFilter = {
            gte: new Date(date),
          }
          break
        case 'month':
          filterQuery = "and sct.created_at >= NOW() - INTERVAL '30 days'"
          dateFilter = {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          }
          break
      }
    }
    const query: string = `SELECT sct.raw_data, users.wallet_address as "walletAddress"  
                              from challenge.sc_transactions sct JOIN "user".users 
                              on users.wallet_address = ANY(SELECT jsonb_array_elements_text(sct.raw_data->'referrers')) 
                              where raw_data->>'method' = 'ReferralsEarned' and raw_data->'referrers' IS NOT NULL 
                              and users.user_id = '${userId}' ${filterQuery}`

    const totalReferees = await users.count({
      where: {
        referrerUserId: userId,
        createdAt: dateFilter,
      },
    })

    const result: JsonObject = await prismaClient.$queryRawUnsafe(query)

    result.forEach((data: JsonObject) => {
      data.raw_data.referrers.forEach((referrer: string, index: number) => {
        if (referrer === data.walletAddress) {
          if (totalReferralCommision[data.raw_data.tokenType]) {
            totalReferralCommision[data.raw_data.tokenType] +=
              data.raw_data.referrelCommissions[index].originalStakedQty
          } else {
            totalReferralCommision[data.raw_data.tokenType] = data.raw_data.referrelCommissions[index].originalStakedQty
          }
        }
      })
    })
    return { totalReferees, totalReferralCommision }
  }
}
