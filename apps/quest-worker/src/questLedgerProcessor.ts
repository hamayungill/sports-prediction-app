import prismaClient from '@duelnow/database'
import { NonRetriableError } from '@duelnow/utils'

import { envs, logger } from './utils'

const { questRewardLedger, userQuests } = prismaClient

/**
 * @function questLedgerProcessor
 * @param userId
 * @param data
 *
 * This function process the messages received by user.quest.ledger topic and verify the user details then
 * credits the points in ledger.
 */
const questLedgerProcessor = async (userId: string, data: { userQuestId: string; reward: number }): Promise<void> => {
  try {
    const whereClause: Record<string, string | number | object> = {
      userQuestId: data.userQuestId,
      userId,
    }
    if (data.reward >= 0) {
      whereClause.completedAt = {
        not: null,
      }
    }
    const userQuestData = await userQuests.findFirst({
      where: whereClause,
    })
    if (!userQuestData) {
      throw new NonRetriableError(
        `User quest with userId = ${userId} and userQuestId = ${data.userQuestId} is either not found or it's not completed.`,
      )
    }
    const questLedgerRec = await questRewardLedger.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        pointsBalance: true,
      },
    })
    let userBalancePoints = data.reward
    if (questLedgerRec) {
      userBalancePoints += Number(questLedgerRec.pointsBalance)
    }
    logger.debug(`questLedgerProcessor response`, questLedgerRec)
    await questRewardLedger.create({
      data: {
        userId,
        userQuestId: data.userQuestId,
        points: data.reward,
        pointsBalance: userBalancePoints,
        pointsRateUsd: envs.pointRateUsd,
      },
    })
  } catch (err) {
    logger.error(`questLedgerProcessor error`, err)
    throw new NonRetriableError(`questLedgerProcessor error: ${JSON.stringify(err)}`)
  }
}

export default questLedgerProcessor
