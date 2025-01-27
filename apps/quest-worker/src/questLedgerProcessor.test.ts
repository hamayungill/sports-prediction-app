import prismaClient from '@duelnow/database'
import { NonRetriableError } from '@duelnow/utils'

import questLedgerProcessor from './questLedgerProcessor'
import { envs, logger } from './utils'

jest.mock('@duelnow/database', () => ({
  questRewardLedger: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  userQuests: {
    findFirst: jest.fn(),
  },
}))
jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))
jest.mock('./utils', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn() },
  envs: {
    pointRateUsd: 0.005,
  },
  getTimeStamp: (dte: string): number | undefined => (dte ? Date.now() + 1000 : undefined),
  producer: { sendMessage: jest.fn() },
}))

describe('questLedgerProcessor', () => {
  const mockFindFirstUserQuests = jest.fn()
  const mockFindFirstQuestLedger = jest.fn()
  const mockCreateQuestLedger = jest.fn()

  const userId = 'test-user-id'
  const userQuestId = 'test-user-quest-id'
  const reward = 100

  beforeEach(() => {
    jest.clearAllMocks()

    prismaClient.userQuests.findFirst = mockFindFirstUserQuests
    prismaClient.questRewardLedger.findFirst = mockFindFirstQuestLedger
    prismaClient.questRewardLedger.create = mockCreateQuestLedger

    logger.error = jest.fn()
    logger.debug = jest.fn()
  })

  it('should successfully process and create a new ledger entry when user quest is found and completed', async () => {
    // Mock the database responses
    mockFindFirstUserQuests.mockResolvedValue({
      userQuestId,
      userId,
      completedAt: new Date(),
    })

    mockFindFirstQuestLedger.mockResolvedValue({
      pointsBalance: 500,
    })

    mockCreateQuestLedger.mockResolvedValue({})

    await questLedgerProcessor(userId, { userQuestId, reward })

    expect(mockFindFirstUserQuests).toHaveBeenCalledWith({
      where: {
        userQuestId,
        userId,
        completedAt: {
          not: null,
        },
      },
    })

    expect(mockFindFirstQuestLedger).toHaveBeenCalledWith({
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

    expect(mockCreateQuestLedger).toHaveBeenCalledWith({
      data: {
        userId,
        userQuestId,
        points: reward,
        pointsBalance: 600, // 500 from ledger + 100 reward
        pointsRateUsd: envs.pointRateUsd,
      },
    })
  })

  it('should create a new ledger entry with initial points if no previous ledger record exists', async () => {
    mockFindFirstUserQuests.mockResolvedValue({
      userQuestId,
      userId,
      completedAt: new Date(),
    })

    mockFindFirstQuestLedger.mockResolvedValue(null)

    mockCreateQuestLedger.mockResolvedValue({})

    await questLedgerProcessor(userId, { userQuestId, reward })

    expect(mockCreateQuestLedger).toHaveBeenCalledWith({
      data: {
        userId,
        userQuestId,
        points: reward,
        pointsBalance: reward, // No previous balance, so initial balance is just the reward
        pointsRateUsd: envs.pointRateUsd,
      },
    })
  })

  it('should throw NonRetriableError if user quest is not found or not completed', async () => {
    mockFindFirstUserQuests.mockResolvedValue(null)

    await expect(questLedgerProcessor(userId, { userQuestId, reward })).rejects.toThrow(NonRetriableError)

    expect(logger.error).toHaveBeenCalledWith(
      `questLedgerProcessor error`,
      new NonRetriableError(
        `User quest with userId = ${userId} and userQuestId = ${userQuestId} is either not found or it's not completed.`,
      ),
    )
  })

  it('should throw NonRetriableError if an error occurs during the ledger processing', async () => {
    mockFindFirstUserQuests.mockResolvedValue({
      userQuestId,
      userId,
      completedAt: new Date(),
    })

    mockFindFirstQuestLedger.mockRejectedValue(new Error('Database Error'))

    await expect(questLedgerProcessor(userId, { userQuestId, reward })).rejects.toThrow(NonRetriableError)

    expect(logger.error).toHaveBeenCalledWith(
      `questLedgerProcessor error`,
      expect.any(Error), // Capturing the error object
    )
  })
})
