import seedCategoriesGroupsSubgroups, {
  getSportIds,
  replaceCategoryWithId,
  replaceGroupId,
  replaceSportWithId,
} from './categoriesGroupSubgroups'
import prismaClient from '../../index'

jest.mock('../../index', () => ({
  sports: {
    findMany: jest.fn().mockResolvedValue([{ sportId: 1, sportName: 'football' }]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
  },
  categories: {
    findFirst: jest.fn().mockResolvedValue({
      categoryId: 1,
      categoryApiTitle: 'test',
      categoryExtTitle: 'test',
      depth: 'Game',
      challengeMode: 'OneVsOne',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'Active',
    }),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([{ categoryId: 1, categoryName: 'football' }]),
  },
  groups: {
    create: jest.fn().mockResolvedValue({}),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([{ groupId: 1, groupName: 'football' }]),
    update: jest.fn().mockResolvedValueOnce({}),
  },
  subgroups: {
    create: jest.fn().mockResolvedValue({}),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValueOnce({}),
  },
  Prisma: {
    CategoryDepth: {
      Pickem: 'Pickem',
      DayPickem: 'DayPickem',
      WeekPickem: 'WeekPickem',
      Game: 'Game',
      Team: 'Team',
      Player: 'Player',
    },
    Status: {
      Active: 'Active',
      Inactive: 'Inactive',
    },
  },
}))

describe('Utility Functions', () => {
  describe('replaceSportWithId', () => {
    it('should replace sport name with corresponding sportId', () => {
      const rawData = [{ sport: 'football', otherField: 'value1' }]
      const sportData = [{ sportName: 'football', sportId: 1 }]

      const result = replaceSportWithId(rawData, sportData)
      expect(result).toEqual([{ sportId: 1, otherField: 'value1' }])
    })

    it('should return an empty object if sport name does not match', () => {
      const rawData = [{ sport: 'cricket', otherField: 'value1' }]
      const sportData = [{ sportName: 'football', sportId: 1 }]

      const result = replaceSportWithId(rawData, sportData)
      expect(result).toEqual([{}])
    })
  })

  describe('replaceCategoryWithId', () => {
    it('should replace categoryId with corresponding categoryId from category data', () => {
      const catData = [{ categoryId: 1 }]
      const categoriesArray = [{ categoryApiTitle: 'Home/Away', categoryExtTitle: 'Home Away', depth: 1 }]
      const catgData = [{ categoryApiTitle: 'Home/Away', categoryExtTitle: 'Home Away', depth: 1, categoryId: 100 }]

      const result = replaceCategoryWithId(catData, categoriesArray, catgData)
      expect(result).toEqual([{ categoryId: 100 }])
    })

    it('should return an empty object if category data does not match', () => {
      const catData = [{ categoryId: 1 }]
      const categoriesArray = [{ categoryApiTitle: 'Home/Away', categoryExtTitle: 'Home Away', depth: 1 }]
      const catgData = [{ categoryApiTitle: 'Over/Under', categoryExtTitle: 'Over Under', depth: 1, categoryId: 100 }]

      const result = replaceCategoryWithId(catData, categoriesArray, catgData)
      expect(result).toEqual([{}])
    })
  })

  describe('replaceGroupId', () => {
    it('should replace group ids with corresponding group ids from group data', () => {
      const grpIds = [1]
      const groupD = [{ groupApiTitle: 'Winning Team', groupExtTitle: 'Winning Team' }]
      const groupsD = [{ groupApiTitle: 'Winning Team', groupExtTitle: 'Winning Team', groupId: 200 }]

      const result = replaceGroupId(grpIds, groupD, groupsD)
      expect(result).toEqual([{ groupId: 200 }])
    })

    it('should return a group id of 0 if group data does not match', () => {
      const grpIds = [1]
      const groupD = [{ groupApiTitle: 'Winning Team', groupExtTitle: 'Winning Team' }]
      const groupsD = [{ groupApiTitle: 'Losing Team', groupExtTitle: 'Losing Team', groupId: 200 }]

      const result = replaceGroupId(grpIds, groupD, groupsD)
      expect(result).toEqual([{ groupId: 0 }])
    })
    it('should update existing groups', async () => {
      // @ts-expect-error mockResolvedValue is part of jest
      prismaClient.groups.findFirst.mockResolvedValueOnce({ groupId: 1 })

      await seedCategoriesGroupsSubgroups()

      expect(prismaClient.groups.update).toHaveBeenCalled()
    })
  })
  it('should update existing subgroups', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.subgroups.findFirst.mockResolvedValueOnce({ subgroupId: 1 })

    await seedCategoriesGroupsSubgroups()

    expect(prismaClient.subgroups.update).toHaveBeenCalled()
  })
})

describe('getSportIds', () => {
  it('should return corresponding sport ids for given sport names', () => {
    const sports = ['football', 'basketball']
    const data = [
      { sportName: 'football', sportId: 1 },
      { sportName: 'basketball', sportId: 2 },
    ]

    const result = getSportIds(sports, data)
    expect(result).toEqual([{ sportId: 1 }, { sportId: 2 }])
  })

  it('should return a sport id of 0 if sport name does not match', () => {
    const sports = ['cricket']
    const data = [{ sportName: 'football', sportId: 1 }]

    const result = getSportIds(sports, data)
    expect(result).toEqual([{ sportId: 0 }])
  })
})

describe('seedCategoriesGroupsSubgroups', () => {
  it('should seed categories, groups, and subgroups correctly', async () => {
    await seedCategoriesGroupsSubgroups()

    expect(prismaClient.sports.findMany).toHaveBeenCalled()
    expect(prismaClient.categories.findFirst).toHaveBeenCalled()
    expect(prismaClient.categories.update).toHaveBeenCalled()
    expect(prismaClient.groups.create).toHaveBeenCalled()
    expect(prismaClient.subgroups.create).toHaveBeenCalled()
  })

  it('should update existing categories if they exist', async () => {
    prismaClient.sports.findMany = jest.fn().mockResolvedValue([{ sportId: 1, sportName: 'football' }])
    prismaClient.categories.findFirst = jest.fn().mockResolvedValue({ categoryId: 1 })
    prismaClient.categories.update = jest.fn().mockResolvedValue({})

    await seedCategoriesGroupsSubgroups()

    expect(prismaClient.categories.update).toHaveBeenCalled()
  })
})

describe('Function Tests', () => {
  const mockSportData = [
    { sportName: 'Basketball', sportId: 1 },
    { sportName: 'Football', sportId: 2 },
    { sportName: 'Soccer', sportId: 3 },
  ]

  const mockCategoriesArray = [
    { categoryApiTitle: 'Home/Away', categoryExtTitle: 'Home Away', depth: 'Game' },
    { categoryApiTitle: 'Over/Under', categoryExtTitle: 'Over Under', depth: 'Team' },
  ]

  const mockCatgData = [
    { categoryApiTitle: 'Home/Away', categoryExtTitle: 'Home Away', depth: 'Game', categoryId: 1 },
    { categoryApiTitle: 'Over/Under', categoryExtTitle: 'Over Under', depth: 'Team', categoryId: 2 },
  ]

  const mockGroupD = [
    { groupApiTitle: 'Winning Team', groupExtTitle: 'Winning Team' },
    { groupApiTitle: 'Overtime', groupExtTitle: 'Overtime' },
  ]

  const mockGroupsD = [
    { groupApiTitle: 'Winning Team', groupExtTitle: 'Winning Team', groupId: 1 },
    { groupApiTitle: 'Overtime', groupExtTitle: 'Overtime', groupId: 2 },
  ]

  test('getSportIds should return correct sportIds', () => {
    const sports = ['basketball', 'football']
    const result = getSportIds(sports, mockSportData)
    expect(result).toEqual([{ sportId: 1 }, { sportId: 2 }])
  })

  test('replaceCategoryWithId should replace categoryId correctly', () => {
    const catData = [{ categoryId: 1 }]
    const result = replaceCategoryWithId(catData, mockCategoriesArray, mockCatgData)
    expect(result).toEqual([{ categoryId: 1 }])
  })

  test('replaceGroupId should replace groupId correctly', () => {
    const grpIds = [1]
    const result = replaceGroupId(grpIds, mockGroupD, mockGroupsD)
    expect(result).toEqual([{ groupId: 1 }])
  })

  test('replaceSportWithId should replace sport with sportId correctly', () => {
    const rawData = [{ sport: 'basketball' }]
    const result = replaceSportWithId(rawData, mockSportData)
    expect(result).toEqual([{ sportId: 1 }])
  })
})
