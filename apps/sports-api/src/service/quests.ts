import prismaClient, { Prisma } from '@duelnow/database'
import { GetParams, PrismaParams } from '@duelnow/utils'

import { ServiceResponse } from '../utils/types'

const { quests, questRewardLedger, users } = prismaClient
const { Status } = Prisma

export class QuestService {
  public async getQuests({ filter, sort, skip, take }: GetParams): Promise<ServiceResponse> {
    const queryObj: PrismaParams = {
      skip,
      take,
      where: {
        status: Status.Active,
      },
    }
    if (filter) queryObj.where = { ...queryObj.where, ...filter }
    if (sort) queryObj.orderBy = sort
    const data = await quests.findMany(queryObj)
    const count = await quests.count({ where: queryObj.where })
    return { data, count }
  }
  public async getUserQuestStats(
    externalUserId: string,
    { filter, sort, skip, take }: GetParams,
  ): Promise<ServiceResponse> {
    const userInfo = await users.findFirst({
      where: {
        externalUserId,
      },
      select: {
        userId: true,
      },
    })
    if (!userInfo) throw new Error(`User with externalUserId = ${externalUserId} not found`)
    const queryObj: PrismaParams = {
      skip,
      take,
      where: {
        status: {
          not: Status.Restricted,
        },
      },
      include: {
        UserQuests: {
          where: {
            userId: userInfo.userId,
          },
          include: {
            UserQuestGoals: {
              include: {
                goal: true,
              },
            },
          },
        },
      },
    }
    if (filter) queryObj.where = { ...queryObj.where, ...filter }
    if (sort) queryObj.orderBy = sort
    const totalPoints = await questRewardLedger.aggregate({
      where: {
        userId: userInfo.userId,
      },
      _sum: {
        points: true,
      },
    })
    const balance = await questRewardLedger.findFirst({
      where: { userId: userInfo.userId },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        pointsBalance: true,
      },
    })
    const questsData = await quests.findMany(queryObj)
    const count = await quests.count({ where: queryObj.where })
    return {
      data: {
        points: {
          allTimeAccrued: totalPoints._sum.points,
          available: balance?.pointsBalance,
        },
        quests: questsData,
      },
      count,
    }
  }
}
