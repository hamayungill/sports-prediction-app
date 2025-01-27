/* eslint-disable @typescript-eslint/no-explicit-any */
import prismaClient, { Prisma } from '@duelnow/database'
import { IKafkaMessageHeaders } from '@duelnow/kafka-client'
import { CancelReasonCode, EVENTS, NonRetriableError } from '@duelnow/utils'

import * as pue from './userQuestsProcessor'
import { logger, producer } from './utils'

jest.mock('./utils', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn() },
  getTimeStamp: (dte: string): number | undefined => (dte ? Date.now() + 1000 : undefined),
  producer: { sendMessage: jest.fn() },
}))

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))
jest.mock('@duelnow/database', () => ({
  quests: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  goals: {
    upsert: jest.fn(),
    count: jest.fn(),
  },
  users: {
    findFirst: jest.fn(),
  },
  userQuests: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  userQuestGoals: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  questRewardLedger: {
    findFirst: jest.fn(),
  },
  events: {
    findFirst: jest.fn(),
  },
  Prisma: {
    Status: {
      Active: 'Active',
      Inactive: 'Inactive',
      Restricted: 'Restricted',
    },
  },
  $queryRawUnsafe: jest.fn(),
}))

const { users, quests, userQuests, userQuestGoals, goals } = prismaClient
const mockUser = {
  userId: 'user1',
  externalUserId: '0xa387e8F358cC74AB2d84C10B1dCF91f033c4d8D1',
  email: 'test@example.com',
  walletAddress: '0xa392e8F358cC74AB2d84C10B1dCF91f033c4d8D1',
  firstName: null,
  lastName: null,
  nickname: 'YieldingBeeScarlet',
  accountStatus: Prisma.Status.Active,
  createdAt: new Date('2024-06-20T07:34:26.052Z'),
  updatedAt: new Date('2024-06-20T07:43:57.234Z'),
  isEmailVerified: true,
  meta: {
    terms: {
      v1_0_0: true,
    },
  },
  handle: 'LRF1OL',
  referralCode: 'LRF1OL',
  referrerUserId: null,
  membershipLevelId: 0,
}
const headers: IKafkaMessageHeaders = {
  traceId: 'test-trace-id',
  caller: 'caller',
  callerId: 'caller-id',
  correlationId: 'correlation-id',
  ip: '0.0.0.0',
  ua: 'test',
}

describe('processUserEvents', () => {
  let mockUserDetails: jest.SpyInstance
  let mockGoalsCount: jest.SpyInstance

  beforeEach(() => {
    mockUserDetails = jest.spyOn(users, 'findFirst').mockResolvedValue(mockUser)
    mockGoalsCount = jest.spyOn(goals, 'count').mockResolvedValue(1)
    jest.spyOn(producer, 'sendMessage').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should process user events successfully', async () => {
    const msgValue = { eventName: 'testEvent', data: { source: 'testSource', source_id: 'sourceId' } }

    const mockProcessGoalSource = jest.spyOn(pue, 'processGoalSource').mockResolvedValueOnce(undefined)
    const mockProcessNegativeSource = jest.spyOn(pue, 'processNegativeSource').mockResolvedValueOnce(undefined)
    mockGoalsCount.mockResolvedValueOnce(1).mockResolvedValueOnce(1)

    await pue.default('user1', msgValue, headers)
    expect(mockUserDetails).toHaveBeenCalledWith({ where: { userId: 'user1', accountStatus: Prisma.Status.Active } })
    expect(mockProcessGoalSource).toHaveBeenCalledWith('user1', 'testEvent', msgValue.data, headers)
    expect(mockProcessNegativeSource).toHaveBeenCalledWith('user1', 'testEvent', msgValue.data, headers)
  })

  it('should throw a NonRetriableError when user is not found', async () => {
    mockUserDetails.mockResolvedValueOnce(null)

    const msgValue = { eventName: 'testEvent', data: { source: 'testSource', source_id: 'sourceId' } }

    await expect(pue.default('user1', msgValue, headers)).rejects.toThrow()

    expect(logger.error).toHaveBeenCalledWith(
      `processUserEvents error`,
      new NonRetriableError(`Either user with userId = user1 account is not active or account not found!`),
    )
  })

  it('should log an error and throw NonRetriableError in case of exception', async () => {
    mockUserDetails.mockImplementationOnce(() => {
      throw new Error('Unexpected error')
    })

    const msgValue = { eventName: 'testEvent', data: { source: 'testSource', source_id: 'sourceId' } }

    await expect(pue.default('user1', msgValue, headers)).rejects.toThrow(
      new NonRetriableError(`processUserEvents error: {}`),
    )

    expect(logger.error).toHaveBeenCalled()
  })
})

describe('processGoalSource', () => {
  let mockFindQuests: jest.SpyInstance
  let mockEventFindFirst: jest.SpyInstance
  let mockCreateUserQuestGoals: jest.SpyInstance
  let mockUserQuestsCount: jest.SpyInstance
  let mockUpdateUserQuests: jest.SpyInstance
  let mockCreateUserQuests: jest.SpyInstance
  let mockUserQuestsFindFirst: jest.SpyInstance
  let mockGetGoalsProgress: jest.SpyInstance
  let mockUserQuestGoalsUpdate: jest.SpyInstance
  let mockProducerSendMessage: jest.SpyInstance
  let mockGetApplicaleRewards: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    jest.resetAllMocks()
    mockFindQuests = jest.spyOn(quests, 'findMany')
    mockCreateUserQuestGoals = jest.spyOn(userQuestGoals, 'create').mockResolvedValue({
      userQuestGoalId: '1',
      progress: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      userQuestId: 'uq1',
      goalId: '1',
    })
    mockUpdateUserQuests = jest.spyOn(userQuests, 'update').mockResolvedValue({
      userQuestId: 'uq1',
      questId: 'q1',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      expiresAt: null,
    })
    mockCreateUserQuests = jest.spyOn(userQuests, 'create').mockResolvedValue({
      userQuestId: 'uq1',
      questId: 'q1',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      expiresAt: null,
    })
    mockUserQuestsFindFirst = jest.spyOn(prismaClient.userQuests, 'findFirst')
    mockGetGoalsProgress = jest.spyOn(pue, 'getGoalsProgress')
    mockUserQuestGoalsUpdate = jest.spyOn(prismaClient.userQuestGoals, 'update')
    mockProducerSendMessage = jest.spyOn(producer, 'sendMessage')
    mockUserQuestsCount = jest.spyOn(prismaClient.userQuests, 'count')
    mockEventFindFirst = jest.spyOn(prismaClient.events, 'findFirst')
    mockGetApplicaleRewards = jest.spyOn(pue, 'getApplicableReward')
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should process goal source successfully', async () => {
    const eventData = { source: 'testSource', source_id: 'sourceId', eventId: 'e1' }
    mockFindQuests.mockResolvedValueOnce([
      {
        questId: 'q1',
        status: Prisma.Status.Active,
        questTitle: '',
        description: '',
        reward: null,
        maxRecurrence: 0,
        goals: null,
        qualifyLevel: [],
        relatedQuestIds: [],
        validFrom: null,
        validUntil: null,
        durationMinutes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        skipLogic: false,
        Goals: [
          {
            goalId: 1,
            target: 1,
          },
        ],
      },
    ])
    await pue.processGoalSource('user1', 'bet_created', eventData, headers)

    expect(mockFindQuests).toHaveBeenCalled()
    expect(mockCreateUserQuests).toHaveBeenCalled()
  })

  it('should handle quest validity range', async () => {
    mockFindQuests.mockResolvedValueOnce([
      {
        questId: 'q1',
        status: Prisma.Status.Active,
        questTitle: '',
        description: '',
        reward: null,
        maxRecurrence: 0,
        goals: null,
        qualifyLevel: [],
        relatedQuestIds: [],
        validFrom: new Date(Date.now() + 1000),
        validUntil: null,
        durationMinutes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        skipLogic: false,
        Goals: [
          {
            goalId: 1,
            target: 1,
          },
        ],
      },
    ])

    const eventData = { source: 'testSource', source_id: 'sourceId', eventId: 'e1' }

    await pue.processGoalSource('user1', 'bet_created', eventData, headers)
    expect(logger.info).toHaveBeenCalled()
  })

  test('should skip quest due to maxRecurrence reached for user', async () => {
    const userId = 'user123'
    const eventName = 'some_event'
    const eventData = { source: 'test_source', source_id: 'test_source_id' }

    const questsData = [
      {
        questId: 'q134',
        status: Prisma.Status.Active,
        questTitle: '',
        description: '',
        reward: null,
        maxRecurrence: 2,
        goals: null,
        qualifyLevel: [],
        relatedQuestIds: [],
        validFrom: null,
        validUntil: null,
        durationMinutes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        skipLogic: false,
        Goals: [
          {
            goalId: 1,
            target: 1,
          },
        ],
      },
    ]

    mockFindQuests.mockResolvedValueOnce(questsData)
    mockUserQuestsCount.mockResolvedValueOnce(2)
    mockUserQuestsFindFirst.mockResolvedValue({
      userQuestId: 'uq123',
      UserQuestGoals: [],
      completedAt: null,
    })
    mockGetGoalsProgress.mockResolvedValue({
      goals: [],
      questCompleted: false,
    })

    await pue.processGoalSource(userId, eventName, eventData, headers)

    expect(mockFindQuests).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          Goals: expect.objectContaining({
            some: expect.objectContaining({
              goalSource: expect.objectContaining({
                equals: eventName,
                mode: 'insensitive',
              }),
            }),
          }),
          OR: [
            {
              status: 'Active',
            },
            {
              status: 'Restricted',
            },
          ],
        },
        include: { Goals: true },
      }),
    )
    expect(logger.error).toHaveBeenCalled()
  })

  test('should throw error if quest is not found', async () => {
    const userId = 'user123'
    const eventName = 'some_event'
    const eventData = { source: 'test_source', source_id: 'test_source_id' }

    mockFindQuests.mockResolvedValueOnce([])
    await pue.processGoalSource(userId, eventName, eventData, headers)
    expect(logger.error).toHaveBeenCalled()
  })

  test('should call pue.getGoalsProgress and update UserQuestGoals', async () => {
    const userId = 'user123'
    const eventName = 'some_event'
    const eventData = { source: 'test_source', source_id: 'test_source_id' }

    const questsData = [
      {
        questId: 'quest123',
        questTitle: 'Test Quest',
        maxRecurrence: 5,
        validFrom: null,
        validUntil: null,
        Goals: [{ goalId: 1, goalSource: 'source', target: 5 }],
        skipLogic: false,
        durationMinutes: 30,
        reward: 100,
      },
    ]

    const userQuest = {
      userQuestId: 'userQuestId',
      completedAt: null,
      expiresAt: new Date(),
      UserQuestGoals: [],
    }

    const goalProgress = {
      goals: [{ goalId: 1, progress: 1, userQuestGoalId: 1 }],
      questCompleted: false,
    }

    mockFindQuests.mockResolvedValue(questsData)
    mockUserQuestsFindFirst.mockResolvedValue(userQuest)
    mockGetGoalsProgress.mockResolvedValueOnce(goalProgress)
    mockUserQuestGoalsUpdate.mockResolvedValue({ userQuestGoalId: 'goal123' })

    await pue.processGoalSource(userId, eventName, eventData, headers)

    expect(mockUserQuestGoalsUpdate).toHaveBeenCalled()
  })

  test('should create new UserQuestGoals and send a Kafka message when quest goal is achieved', async () => {
    const userId = 'user123'
    const eventName = 'some_event'
    const eventData = { source: 'test_source', source_id: 'test_source_id' }

    const questsData = [
      {
        questId: 'quest123',
        questTitle: 'Test Quest',
        maxRecurrence: 5,
        validFrom: null,
        validUntil: null,
        Goals: [{ goalId: 1, goalSource: 'source', target: 5 }],
        skipLogic: false,
        durationMinutes: 30,
        reward: { reward: 100 },
      },
    ]

    const userQuest = {
      userQuestId: 'userQuestId',
      completedAt: null,
      expiresAt: new Date(),
      UserQuestGoals: [],
    }

    const goalProgress = {
      goals: [{ goalId: 1, progress: 5 }],
      questCompleted: true,
    }

    mockFindQuests.mockResolvedValue(questsData)
    mockUserQuestsFindFirst.mockResolvedValue(userQuest)
    mockGetGoalsProgress.mockResolvedValue(goalProgress)
    mockCreateUserQuestGoals.mockResolvedValue({ userQuestGoalId: 'goal123' })

    await pue.processGoalSource(userId, eventName, eventData, headers)

    expect(mockCreateUserQuestGoals).toHaveBeenCalled()
    expect(mockProducerSendMessage).toHaveBeenCalledTimes(3)
  })

  it('should send a GOAL.ACHIEVED message if goal progress equals target', async () => {
    // Mock quest data
    const eventData = {
      source: 'testSource',
      source_id: 'testSourceId',
      eventId: 'testEventId',
    }
    const userId = 'testUser'
    const eventName = 'testEvent'

    const questData = [
      {
        questId: 'questId1',
        validFrom: null,
        validUntil: null,
        maxRecurrence: 1,
        Goals: [{ goalId: 1, goalSource: eventName, target: 5 }],
        skipLogic: false,
      },
    ]

    // Mock user quest and goals
    const userQuest = {
      userQuestId: 'userQuestId1',
      UserQuestGoals: [{ userQuestGoalId: 1, goalId: 1, progress: 5, target: 5 }],
    }

    mockFindQuests.mockResolvedValueOnce(questData)
    mockUserQuestsFindFirst.mockResolvedValueOnce(userQuest)
    mockUpdateUserQuests.mockResolvedValueOnce(userQuest)

    mockUserQuestGoalsUpdate.mockResolvedValueOnce({
      userQuestGoalId: 1,
      progress: 5,
    })

    await pue.processGoalSource(userId, eventName, eventData, headers)

    // Verify that the GOAL.ACHIEVED message is sent when progress equals target
    expect(producer.sendMessage).toHaveBeenCalledTimes(2)
  })

  it('should process reward as array and send a message to the ledger', async () => {
    const userId = 'mockUserId'
    const eventName = 'mockEventName'
    const eventData = { eventId: 'mockEventId', source: 'mockSource', source_id: 'mockSourceId' }

    const questsData = {
      questId: 1,
      validFrom: null,
      validUntil: null,
      status: 'Active',
      maxRecurrence: 0,
      skipLogic: false,
      Goals: [{ goalId: 1, goalSource: eventName, target: 10 }],
      reward: { reward: [{ lower_threshold: 0, upper_threshold: 100, reward: 50 }] },
    }

    const userQuest = {
      userQuestId: 'userQuestId',
      completedAt: null,
      expiresAt: new Date(),
      UserQuestGoals: [],
    }

    const goalProgress = {
      goals: [{ goalId: 1, progress: 5 }],
      questCompleted: true,
    }
    const mockEventInfo = { data: { bet: { amountInUsd: 50 } } }
    mockFindQuests.mockResolvedValue([questsData])
    mockEventFindFirst.mockResolvedValue(mockEventInfo)
    mockUserQuestsFindFirst.mockResolvedValue(userQuest)
    mockGetGoalsProgress.mockResolvedValue(goalProgress)
    mockCreateUserQuestGoals.mockResolvedValue({ userQuestGoalId: 'goal123' })
    mockGetApplicaleRewards.mockReturnValueOnce(50)

    await pue.processGoalSource(userId, eventName, eventData, headers)

    expect(producer.sendMessage).toHaveBeenCalledTimes(3)
  })
})

describe('getApplicableReward', () => {
  test('should return the correct reward when qualifier is within the threshold', () => {
    const rewards = [
      { lower_threshold: 0, upper_threshold: 10, reward: 100 },
      { lower_threshold: 10, upper_threshold: 20, reward: 200 },
      { lower_threshold: 20, upper_threshold: 30, reward: 300 },
    ]

    const qualifier = 15
    const result = pue.getApplicableReward(rewards, qualifier)
    expect(result).toBe(200)
  })

  test('should return 0 when qualifier does not match any threshold', () => {
    const rewards = [
      { lower_threshold: 0, upper_threshold: 10, reward: 100 },
      { lower_threshold: 10, upper_threshold: 20, reward: 200 },
    ]

    const qualifier = 25 // Out of range
    const result = pue.getApplicableReward(rewards, qualifier)
    expect(result).toBe(0)
  })

  test('should return 0 when the reward array is empty', () => {
    const rewards: Record<string, number>[] = []
    const qualifier = 15
    const result = pue.getApplicableReward(rewards, qualifier)
    expect(result).toBe(0)
  })
})

describe('getGoalsProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })
  test('should update progress when user goals match quest goals', async () => {
    const questGoals: Prisma.Goals[] = [
      {
        goalId: '1',
        goalSource: 'sourceA',
        target: 5,
        questId: '',
        description: '',
        negativeSource: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        goalId: '2',
        goalSource: 'sourceB',
        target: 10,
        questId: '',
        description: '',
        negativeSource: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const userGoals = [
      {
        goalId: '1',
        progress: 2,
        userQuestId: 'uq123',
        userQuestGoalId: '1',
      },
      {
        goalId: '2',
        progress: 8,
        userQuestId: 'uq124',
        userQuestGoalId: '2',
      },
    ]

    const eventName = 'sourceA'

    // @ts-expect-error createdAt is not needed
    const result = await pue.getGoalsProgress(questGoals, userGoals, eventName)
    expect(result.goals).toEqual([
      {
        goalId: '1',
        progress: 3,
        userQuestId: 'uq123',
        target: 5,
        userQuestGoalId: '1',
      },
      {
        goalId: '2',
        progress: 9,
        userQuestId: 'uq124',
        target: 10,
        userQuestGoalId: '2',
      },
    ])
    expect(result.questCompleted).toBe(false)
  })

  test('should initialize progress when user goals are empty', async () => {
    const questGoals: Prisma.Goals[] = [
      {
        goalId: '1',
        goalSource: 'sourceA',
        target: 5,
        questId: '',
        description: '',
        negativeSource: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        goalId: '2',
        goalSource: 'sourceB',
        target: 10,
        questId: '',
        description: '',
        negativeSource: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const userGoals: any[] = [] // No user goals

    const eventName = 'sourceA'

    const result = await pue.getGoalsProgress(questGoals, userGoals, eventName)

    expect(result.goals).toEqual([
      { goalId: '1', progress: 1, target: 5 },
      { goalId: '2', progress: 0, target: 10 },
    ])
    expect(result.questCompleted).toBe(false)
  })

  test('should mark quest as completed when all goals are met', async () => {
    const questGoals: Prisma.Goals[] = [
      {
        goalId: '1',
        goalSource: 'sourceA',
        target: 2,
        questId: '',
        description: '',
        negativeSource: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        goalId: '2',
        goalSource: 'sourceB',
        target: 3,
        questId: '',
        description: '',
        negativeSource: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const userGoals = [
      {
        goalId: '1',
        progress: 2,
        userQuestId: 'uq123',
        createdAt: new Date(),
        updatedAt: new Date(),
        userQuestGoalId: '2',
      },
      {
        goalId: '2',
        progress: 3,
        userQuestId: 'uq124',
        createdAt: new Date(),
        updatedAt: new Date(),
        userQuestGoalId: '2',
      },
    ]

    const eventName = 'sourceA'

    const result = await pue.getGoalsProgress(questGoals, userGoals, eventName)

    expect(result.goals).toEqual(userGoals) // No progress increment since goals are already met
    expect(result.questCompleted).toBe(true)
  })

  test('should not increment progress if goal source does not match event name', async () => {
    const questGoals: Prisma.Goals[] = [
      {
        goalId: '1',
        goalSource: 'sourceA',
        target: 5,
        questId: '',
        description: '',
        negativeSource: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const userGoals = [
      {
        goalId: '1',
        progress: 2,
        userQuestId: 'uq123',
        createdAt: new Date(),
        updatedAt: new Date(),
        userQuestGoalId: '2',
      },
    ]

    const eventName = 'sourceB' // Different event name

    const result = await pue.getGoalsProgress(questGoals, userGoals, eventName)

    expect(result.goals).toEqual(userGoals) // Progress should not be incremented
    expect(result.questCompleted).toBe(false)
  })

  test('should handle no user goals and unmatched event source', async () => {
    const questGoals: Prisma.Goals[] = [
      {
        goalId: '1',
        goalSource: 'sourceA',
        target: 5,
        questId: '',
        description: '',
        negativeSource: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const userGoals: any[] = [] // No user goals
    const eventName = 'sourceB' // Different event name

    const result = await pue.getGoalsProgress(questGoals, userGoals, eventName)

    expect(result.goals).toEqual([{ goalId: '1', progress: 0, target: 5 }])
    expect(result.questCompleted).toBe(false)
  })
})

describe('processNegativeSource', () => {
  const userId = 'user123'
  const headers = {} as any
  let mockUserQuestGoalsFindFirst: jest.SpyInstance
  let mockUserQuestGoalsUpdate: jest.SpyInstance
  let mockQuestRewardLedgerFindFirst: jest.SpyInstance
  let mockQueryRawUnsafe: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockUserQuestGoalsFindFirst = jest.spyOn(prismaClient.userQuestGoals, 'findFirst')
    mockUserQuestGoalsUpdate = jest.spyOn(prismaClient.userQuestGoals, 'update')
    mockQuestRewardLedgerFindFirst = jest.spyOn(prismaClient.questRewardLedger, 'findFirst')
    mockQueryRawUnsafe = jest.spyOn(prismaClient, '$queryRawUnsafe')
  })

  it('should return early if eventName is EVENTS.BET.CANCELLED but reasonCode is not UserCancellation', async () => {
    const event = { challenge: { reasonCode: 'OtherReason' } }
    await pue.processNegativeSource(userId, EVENTS.BET.CANCELLED, event, headers)

    expect(prismaClient.userQuestGoals.findMany).not.toHaveBeenCalled()
  })

  it('should process goals when eventName matches and reasonCode is UserCancellation', async () => {
    const event = {
      data: {
        challenge: { reasonCode: CancelReasonCode.UserCancellation },
        source: 'source1',
        source_id: 'source_id1',
      },
    }

    mockQueryRawUnsafe.mockResolvedValueOnce([{ userQuestGoalId: 1 }, { userQuestGoalId: 2 }, { userQuestGoalId: 3 }])
    mockUserQuestGoalsFindFirst.mockResolvedValue({
      userQuestGoalId: 1,
      progress: 5,
      goal: { goalSource: 'source' },
      userQuestId: 'quest1',
      userQuest: { userQuestId: 'quest1', completedAt: new Date() },
    })
    mockUserQuestGoalsUpdate.mockResolvedValueOnce({
      userQuestGoalId: 1,
      userQuestId: 'uq1',
      goalId: 1,
      progress: 4,
    })
    mockQuestRewardLedgerFindFirst.mockResolvedValueOnce({ ledgerId: 'ledger1' }).mockResolvedValueOnce(null)
    await pue.processNegativeSource(userId, EVENTS.BET.CANCELLED, event, headers)

    expect(prismaClient.userQuestGoals.update).toHaveBeenCalledWith({
      where: { userQuestGoalId: 1 },
      data: { progress: 4 },
    })

    expect(producer.sendMessage).toHaveBeenCalledWith(expect.any(String), expect.any(Object), headers)
  })

  it('should log an error if source or source_id is missing in event object', async () => {
    const event = {
      data: {
        challenge: {
          reasonCode: CancelReasonCode.UserCancellation,
        },
      },
    }

    await pue.processNegativeSource(userId, EVENTS.BET.CANCELLED, event, headers)

    expect(logger.error).toHaveBeenCalledWith(`source and source_id not found in the Kafka message`, event)
  })

  it('should throw NonRetriableError if an error occurs', async () => {
    const event = {
      data: {
        challenge: { reasonCode: CancelReasonCode.UserCancellation },
        source: 'source1',
        source_id: 'source_id1',
      },
    }
    mockQueryRawUnsafe.mockRejectedValue(new Error('Database error'))

    await expect(pue.processNegativeSource(userId, EVENTS.BET.CANCELLED, event, headers)).rejects.toThrow(
      NonRetriableError,
    )
  })
})
