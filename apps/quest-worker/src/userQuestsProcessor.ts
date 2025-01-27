/* eslint-disable @typescript-eslint/no-explicit-any */
import prismaClient, { Prisma } from '@duelnow/database'
import { IKafkaMessage, IKafkaMessageHeaders } from '@duelnow/kafka-client'
import { CancelReasonCode, EVENTS, NonRetriableError, TOPICS } from '@duelnow/utils'

import { addMinutes, getTimeStamp, logger, producer } from './utils'

const { Status } = Prisma
const { events, goals, quests, userQuests, users, userQuestGoals, questRewardLedger } = prismaClient

type GoalsArray = {
  userQuestGoalId?: string
  userQuestId?: string
  goalId: string
  progress: number
  createdAt?: Date
  updatedAt?: Date
  target?: number
}[]
type QuestGoal = Prisma.UserQuestGoals
interface ExtendGoals extends QuestGoal {
  target?: number
}

/**
 * @function getApplicableReward
 * @param rewards
 * @param qualifier
 * @returns {Number}
 * This function checks the reward array for matching threshould to find the applicable reward.
 */
export const getApplicableReward = (rewards: Record<string, number>[], qualifier: number): number => {
  let rewardPoints = 0
  for (const { lower_threshold, upper_threshold, reward } of rewards) {
    if (qualifier >= lower_threshold && qualifier < upper_threshold) {
      rewardPoints = reward
    }
  }
  return rewardPoints
}

/**
 * @function getGoalsProgress
 * @param questGoals
 * @param userGoals
 * @param eventName
 * @returns { goals, questCompleted }
 *
 * This function check the goal progress and if the goal type matches increases the count
 * and checks if the quest is completed or not.
 */
export const getGoalsProgress = async (
  questGoals: Prisma.Goals[],
  userGoals: ExtendGoals[] | [],
  eventName: string,
): Promise<{ goals: GoalsArray; questCompleted: boolean }> => {
  let questCompleted = true
  let goals: GoalsArray = []
  for (const eachQgoal of questGoals) {
    if (userGoals.length) {
      for (const eachUGoal of userGoals) {
        if (eachQgoal.goalId === eachUGoal.goalId) {
          eachUGoal.target = eachQgoal.target
          if (Number(eachQgoal.target) > eachUGoal.progress && eachQgoal.goalId === eachUGoal.goalId) {
            eachUGoal.progress = Number(eachUGoal.progress) + 1
          }
        }
      }
      goals = userGoals
    } else {
      if (eachQgoal.goalSource === eventName) {
        goals.push({ goalId: eachQgoal.goalId, progress: 1, target: eachQgoal.target })
      } else {
        goals.push({ goalId: eachQgoal.goalId, progress: 0, target: eachQgoal.target })
      }
    }
  }
  for (const eachQgoal of questGoals) {
    for (const eachGoal of goals) {
      if (eachQgoal.goalId === eachGoal.goalId && eachGoal.progress < Number(eachQgoal.target)) {
        questCompleted = false
      }
    }
  }
  return { goals, questCompleted }
}

/**
 * @function processUserEvents
 * @param userId
 * @param eventName
 * @param headers
 *
 * This function processes the messages received to tracking.quest.userquests topic
 * if the quest is completed send message to user.quest.ledger topic
 */
const processUserEvents = async (
  userId: string,
  msgValue: Record<string, any>,
  headers: IKafkaMessageHeaders,
): Promise<void> => {
  try {
    const userDetails = await users.findFirst({ where: { userId, accountStatus: Status.Active } })
    if (!userDetails) {
      throw new NonRetriableError(`Either user with userId = ${userId} account is not active or account not found!`)
    }
    const { eventName, data } = msgValue
    const posGoalsCount = await goals.count({
      where: {
        goalSource: eventName,
      },
    })
    const negGoalsCount = await goals.count({
      where: {
        negativeSource: eventName,
      },
    })
    if (posGoalsCount > 0) await processGoalSource(userId, eventName, data, headers)
    if (negGoalsCount > 0) await processNegativeSource(userId, eventName, data, headers)
  } catch (err) {
    logger.error(`processUserEvents error`, err)
    throw new NonRetriableError(`processUserEvents error: ${JSON.stringify(err)}`)
  }
}

export const processGoalSource = async (
  userId: string,
  eventName: string,
  eventData: Record<string, any>,
  headers: IKafkaMessageHeaders,
): Promise<void> => {
  try {
    const questsData = await quests.findMany({
      where: {
        Goals: {
          some: {
            goalSource: { equals: eventName, mode: 'insensitive' },
          },
        },
        OR: [
          {
            status: Status.Active,
          },
          {
            status: Status.Restricted,
          },
        ],
      },
      include: {
        Goals: true,
      },
    })
    if (!questsData || !questsData.length) {
      logger.error(`Either quest with goal_source = ${eventName} is not active or not found!`)
      return
    }
    for (const quest of questsData) {
      // Checking the quest validity
      if (
        (quest?.validFrom && Date.now() < getTimeStamp(quest.validFrom.toISOString())) ||
        (quest?.validUntil && Date.now() > getTimeStamp(quest.validUntil.toISOString()))
      ) {
        logger.info(`Due to out of range validity skipping the quest with questId = ${quest.questId}`)
        continue
      }
      const userCompletedQuestCount = await userQuests.count({
        where: {
          userId,
          questId: quest.questId,
          completedAt: {
            not: {
              equals: null,
            },
          },
        },
      })
      // Checking max occurance reached or not for the quest per user
      if (quest.maxRecurrence > 0 && quest.maxRecurrence === userCompletedQuestCount) {
        logger.error(`User reached maxRecurrence for the ${quest.questTitle} quest.`)
        continue
      }
      let expiry: object | null = null
      if (quest.durationMinutes) {
        expiry = {
          gt: new Date(),
        }
      }
      let userQuestResp = await userQuests.findFirst({
        where: {
          userId,
          questId: quest.questId,
          completedAt: null,
          expiresAt: expiry,
        },
        include: {
          UserQuestGoals: true,
        },
      })
      // Processing only the quests which requires consumer to apply the business logic.
      if (!quest.skipLogic && Array.isArray(quest.Goals)) {
        const questGoals = await getGoalsProgress(quest.Goals, userQuestResp?.UserQuestGoals || [], eventName)

        if (userQuestResp) {
          userQuestResp = await userQuests.update({
            where: {
              userQuestId: userQuestResp.userQuestId,
            },
            data: {
              completedAt: questGoals.questCompleted ? new Date() : null,
            },
            include: {
              UserQuestGoals: true,
            },
          })
        } else {
          userQuestResp = await userQuests.create({
            data: {
              questId: quest.questId,
              userId,
              expiresAt: quest.durationMinutes ? addMinutes(quest.durationMinutes) : null,
              completedAt: questGoals.questCompleted ? new Date() : null,
            },
            include: {
              UserQuestGoals: true,
            },
          })
        }
        for (const eachGoal of questGoals.goals) {
          let userQuestGoalResp = null
          if (eachGoal.userQuestGoalId) {
            userQuestGoalResp = await userQuestGoals.update({
              where: {
                userQuestGoalId: eachGoal.userQuestGoalId,
              },
              data: {
                progress: eachGoal.progress,
              },
            })
          } else {
            userQuestGoalResp = await userQuestGoals.create({
              data: {
                goalId: eachGoal.goalId,
                progress: eachGoal.progress,
                userQuestId: userQuestResp.userQuestId,
              },
            })
          }
          if (eachGoal.progress === eachGoal.target) {
            const kafkaMessage: IKafkaMessage = {
              key: userId,
              value: {
                eventName: EVENTS.QUEST.GOAL.ACHIEVED,
                data: {
                  user_quest_goal_id: userQuestGoalResp.userQuestGoalId,
                  source: eventData?.data?.source,
                  source_id: eventData?.data?.source_id,
                  eventId: eventData.eventId,
                },
              },
            }
            producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, headers)
          } else {
            const kafkaMessage: IKafkaMessage = {
              key: userId,
              value: {
                eventName: EVENTS.QUEST.GOAL.PROGRESSED,
                data: {
                  user_quest_goal_id: userQuestGoalResp.userQuestGoalId,
                  progress: eachGoal.progress,
                  source: eventData?.data?.source,
                  source_id: eventData?.data?.source_id,
                  eventId: eventData.eventId,
                },
              },
            }
            producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, headers)
          }
        }

        // If quest is completed sending details to ledger topic by calculating the reward
        if (questGoals.questCompleted) {
          let reward =
            quest?.reward && typeof quest.reward === 'object' && 'reward' in quest.reward ? quest.reward.reward : null
          logger.debug(`reward from quest worker`, reward)
          /** Checking the reward value in quest is array or number
           *  If it's array checking the matching threshould and finding applicable reward
           *  If it's number directly sending it to ledger topic.
           */
          if (reward && Array.isArray(reward)) {
            const eventInfo = await events.findFirst({
              where: {
                eventId: eventData.eventId,
                eventName,
              },
              orderBy: {
                createdAt: 'desc',
              },
            })
            logger.debug(`eventInfo from quest worker`, eventInfo)

            // @ts-expect-error data is object which has bet field
            if (eventInfo?.data?.bet?.amountInUsd) {
              // @ts-expect-error As we have defined reward as an array of object in DB it will have required types.
              reward = getApplicableReward(reward, eventInfo?.data?.bet?.amountInUsd)
              const kafkaMessage: IKafkaMessage = {
                key: userId,
                value: {
                  eventName: EVENTS.QUEST.COMPLETED,
                  data: {
                    userQuestId: userQuestResp.userQuestId,
                    reward,
                  },
                },
              }
              logger.debug(`getApplicableReward from quest worker`, reward)
              producer.sendMessage(TOPICS.USER.QUEST.LEDGER, kafkaMessage, headers)
            }
          } else if (typeof reward === 'number') {
            const kafkaMessage: IKafkaMessage = {
              key: userId,
              value: {
                eventName: EVENTS.QUEST.COMPLETED,
                data: {
                  userQuestId: userQuestResp.userQuestId,
                  reward,
                },
              },
            }
            producer.sendMessage(TOPICS.USER.QUEST.LEDGER, kafkaMessage, headers)
          }
          const kafkaMessage: IKafkaMessage = {
            key: userId,
            value: {
              eventName: EVENTS.QUEST.COMPLETED,
              data: {
                user_quest_id: userQuestResp.userQuestId,
                reward_points: reward,
                eventId: eventData.eventId,
              },
            },
          }
          producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, headers)
        }
      } else {
        // TODO: Write logic for messages which does not require logic to be applied.
      }
    }
  } catch (err) {
    logger.error(`processGoalSource error`, err)
    throw new NonRetriableError(`processGoalSource error: ${JSON.stringify(err)}`)
  }
}

export const processNegativeSource = async (
  userId: string,
  eventName: string,
  event: Record<string, any>,
  headers: IKafkaMessageHeaders,
): Promise<void> => {
  try {
    // Check the bet cancellation reason is CancelReasonCode.UserCancellation before negating rewards.
    if (
      eventName === EVENTS.BET.CANCELLED &&
      event?.data?.challenge?.reasonCode !== CancelReasonCode.UserCancellation
    ) {
      logger.info(`CancelReasonCode is not equals to ${CancelReasonCode.UserCancellation}`, event)
      return
    }
    if (event?.data?.source && event?.data?.source_id) {
      // Collecting all distinct user_quest_goal_id from the events data column
      const eventsInfo = await prismaClient.$queryRawUnsafe(`
        select distinct e."data" ->> 'user_quest_goal_id' as "userQuestGoalId" from "user".events e 
        where e.event_name in ('${EVENTS.QUEST.GOAL.ACHIEVED}','${EVENTS.QUEST.GOAL.PROGRESSED}') and e.user_id = '${userId}' 
        and e."data" ->> 'source' = '${event.data.source}' and e."data" ->> 'source_id' = '${event.data.source_id}' ;`)

      if (eventsInfo && Array.isArray(eventsInfo)) {
        for (const { userQuestGoalId } of eventsInfo) {
          const usrQstGls = await userQuestGoals.findFirst({
            where: {
              userQuestGoalId: userQuestGoalId,
              goal: {
                negativeSource: { equals: eventName, mode: 'insensitive' },
              },
            },
            include: {
              goal: true,
              userQuest: true,
            },
          })
          if (usrQstGls) {
            // User can earn points only once after completing the quest or achieving all goals of a quest so using findFirst in DESC order
            if (usrQstGls.userQuest.completedAt) {
              // Considering the entries a minute before completedAt to not to miss the records created in ledger
              const oneMinuteBeforeCompledAt = new Date(usrQstGls.userQuest.completedAt.getTime() - 60 * 1000)
              const ledgerPosRecord = await questRewardLedger.findFirst({
                where: {
                  userQuestId: usrQstGls.userQuestId,
                  createdAt: {
                    gte: oneMinuteBeforeCompledAt,
                  },
                  points: {
                    gt: 0,
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
              })
              const ledgerNegRecord = await questRewardLedger.findFirst({
                where: {
                  userQuestId: usrQstGls.userQuestId,
                  createdAt: {
                    gte: oneMinuteBeforeCompledAt,
                  },
                  points: {
                    lt: 0,
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
              })
              // Making sure that the points are not negated already to for the same user quest
              if (!ledgerNegRecord && ledgerPosRecord) {
                const kafkaMessage: IKafkaMessage = {
                  key: userId,
                  value: {
                    eventName: EVENTS.QUEST.GOAL.REVERTED,
                    data: {
                      userQuestId: usrQstGls.userQuestId,
                      reward: -ledgerPosRecord.points,
                    },
                  },
                }
                producer.sendMessage(TOPICS.USER.QUEST.LEDGER, kafkaMessage, headers)
              }
            } else {
              logger.info(`Either ledgerNegRecord found or ledgerPosRecord not found`)
            }
            if (usrQstGls.progress > 0) {
              await userQuestGoals.update({
                where: {
                  userQuestGoalId: userQuestGoalId,
                },
                data: {
                  progress: usrQstGls.progress - 1,
                },
              })
              await userQuests.update({
                where: {
                  userQuestId: usrQstGls.userQuestId,
                },
                data: {
                  completedAt: null,
                },
              })

              const kafkaMessage: IKafkaMessage = {
                key: userId,
                value: {
                  eventName: EVENTS.QUEST.GOAL.REVERTED,
                  data: {
                    user_quest_goal_id: userQuestGoalId,
                    eventId: event.eventId,
                  },
                },
              }
              producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, headers)
            } else {
              logger.info(`progress is less than 1`, usrQstGls)
            }
          } else {
            logger.info(
              `userQuestGoals with userQuestGoalId=${userQuestGoalId} and negativeSource=${eventName} not found`,
            )
          }
        }
      }
    } else {
      logger.error(`source and source_id not found in the Kafka message`, event)
    }
  } catch (err) {
    logger.error(`processNegativeSource error`, err)
    throw new NonRetriableError(`processNegativeSource error: ${JSON.stringify(err)}`)
  }
}

export default processUserEvents
