import seedQuests, { questsList } from './quests'
import prismaClient from '../../index'

jest.mock('../../index', () => ({
  quests: {
    upsert: jest.fn(),
  },
  goals: {
    upsert: jest.fn(),
  },
  Prisma: {
    Status: {
      Active: 'Active',
      Inactive: 'Inactive',
    },
  },
}))

describe('seedQuests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should upsert each quest with the correct data', async () => {
    await seedQuests()

    expect(prismaClient.quests.upsert).toHaveBeenCalledTimes(questsList.length) // Number of unique quests in the list

    questsList.forEach((quest) => {
      delete quest.goals
      const questObj = {
        ...quest,
      }
      expect(prismaClient.quests.upsert).toHaveBeenCalledWith({
        where: {
          questId: quest.questId,
        },
        create: questObj,
        update: questObj,
      })
    })
  })

  it('should handle duplicate quest IDs correctly', async () => {
    await seedQuests()

    // Check if the `win_3_bets` quest was processed twice due to its duplication
    // @ts-expect-error mock is jest function
    const win3BetsCalls = prismaClient.quests.upsert.mock.calls.filter(([call]) => call.where.questId === 'win_3_bets')

    expect(win3BetsCalls).toHaveLength(1)
  })

  it('should upsert quests with nested reward objects correctly', async () => {
    const complexQuest = questsList.find((quest) => quest.questId === 'wager_bet_created')
    if (complexQuest?.goals) complexQuest['goals'] = []

    await seedQuests()

    expect(prismaClient.quests.upsert).toHaveBeenCalledWith({
      where: {
        questId: complexQuest?.questId,
      },
      create: complexQuest,
      update: complexQuest,
    })

    const reward = complexQuest?.reward.reward
    expect(reward).toBeInstanceOf(Array)
    if (Array.isArray(reward)) {
      reward.forEach((rewardTier) => {
        expect(rewardTier).toHaveProperty('lower_threshold')
        expect(rewardTier).toHaveProperty('upper_threshold')
        expect(rewardTier).toHaveProperty('reward')
      })
    }
  })
})
