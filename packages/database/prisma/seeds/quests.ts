/* eslint-disable @typescript-eslint/no-explicit-any */
import prismaClient, { Prisma } from '../../index'

const { Status } = Prisma
const { quests, goals } = prismaClient

interface QuestList {
  questId: string
  questTitle: string
  status: Prisma.Status
  description: string
  reward: any
  maxRecurrence: number
  relatedQuestIds: string[]
  goals?: { goalSource: string; description: string; target: number; negativeSource?: string }[]
}

export const questsList: QuestList[] = [
  {
    questId: 'account_created',
    questTitle: 'Account Created',
    status: Status.Active,
    description: 'AirDrop Quest - Account Created',
    relatedQuestIds: [],
    reward: { reward: 1000 },
    maxRecurrence: 1,
    goals: [
      {
        goalSource: 'sign_up_completed',
        description: 'Create a new account',
        target: 1,
      },
    ],
  },
  {
    questId: 'bet_created',
    questTitle: 'Bet Created',
    status: Status.Active,
    description: 'AirDrop Quest - Bet Created',
    relatedQuestIds: [],
    reward: { reward: 250 },
    maxRecurrence: -1,
    goals: [
      {
        goalSource: 'bet_created',
        description: 'Create a new bet',
        target: 1,
        negativeSource: 'bet_cancelled',
      },
    ],
  },
  {
    questId: 'wager_bet_created',
    questTitle: 'Bet Created Wager',
    status: Status.Restricted,
    description: 'AirDrop Quest - Bet Created Wager',
    relatedQuestIds: [],
    reward: {
      reward: [
        {
          lower_threshold: 10,
          upper_threshold: 51,
          reward: 100,
        },
        {
          lower_threshold: 51,
          upper_threshold: 301,
          reward: 200,
        },
        {
          lower_threshold: 301,
          upper_threshold: 1001,
          reward: 300,
        },
        {
          lower_threshold: 1001,
          upper_threshold: 5001,
          reward: 400,
        },
        {
          lower_threshold: 5001,
          upper_threshold: 10001,
          reward: 500,
        },
        {
          lower_threshold: 10001,
          upper_threshold: 999999999,
          reward: 1000,
        },
      ],
    },
    maxRecurrence: -1,
    goals: [
      {
        goalSource: 'bet_created',
        description: 'Create bet wager',
        target: 1,
        negativeSource: 'bet_cancelled',
      },
    ],
  },
  {
    questId: 'bet_joined',
    questTitle: 'Bet Joined',
    status: Status.Active,
    description: 'AirDrop Quest - Bet Joined',
    relatedQuestIds: [],
    reward: { reward: 250 },
    maxRecurrence: -1,
    goals: [
      {
        goalSource: 'bet_joined',
        description: 'Joined a bet',
        target: 1,
        negativeSource: 'bet_cancelled',
      },
    ],
  },
  {
    questId: 'wager_bet_joined',
    questTitle: 'Bet Joined Wager',
    status: Status.Restricted,
    description: 'AirDrop Quest - Bet Joined Wager',
    relatedQuestIds: [],
    reward: {
      reward: [
        {
          lower_threshold: 10,
          upper_threshold: 51,
          reward: 100,
        },
        {
          lower_threshold: 51,
          upper_threshold: 301,
          reward: 200,
        },
        {
          lower_threshold: 301,
          upper_threshold: 1001,
          reward: 300,
        },
        {
          lower_threshold: 1001,
          upper_threshold: 5001,
          reward: 400,
        },
        {
          lower_threshold: 5001,
          upper_threshold: 10001,
          reward: 500,
        },
        {
          lower_threshold: 10001,
          upper_threshold: 999999999,
          reward: 1000,
        },
      ],
    },
    maxRecurrence: -1,
    goals: [
      {
        goalSource: 'bet_joined',
        description: 'Join bet wager',
        target: 1,
        negativeSource: 'bet_cancelled',
      },
    ],
  },
  {
    questId: 'win_3_bets',
    questTitle: 'Win 3 Bets',
    status: Status.Active,
    description: 'AirDrop Quest - Win 3 Bets',
    relatedQuestIds: [],
    reward: { reward: 1000 },
    maxRecurrence: 1,
    goals: [
      {
        goalSource: 'bet_won',
        description: 'Won a bet',
        target: 3,
      },
    ],
  },
]

const seedQuests = async (): Promise<void> => {
  for (const quest of questsList) {
    const goalz = quest.goals
    const questObj = quest
    delete questObj.goals
    await quests.upsert({
      where: {
        questId: quest.questId,
      },
      create: questObj,
      update: questObj,
    })
    if (goalz && goalz.length)
      for (const gol of goalz) {
        if (gol.goalSource && typeof gol.goalSource === 'string')
          await goals.upsert({
            where: {
              questId_goalSource: {
                questId: quest.questId,
                goalSource: gol.goalSource,
              },
            },
            create: {
              questId: quest.questId,
              ...gol,
            },
            update: {
              questId: quest.questId,
              ...gol,
            },
          })
      }
  }
}

export default seedQuests
