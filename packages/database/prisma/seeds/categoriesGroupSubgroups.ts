/* eslint-disable @typescript-eslint/no-explicit-any */
import prismaClient, { Prisma } from '../../index'

const { Status, CategoryDepth } = Prisma
const { categories, groups, sports, subgroups } = prismaClient

const subgroupsData = [
  {
    subgroupApiTitle: 'Yes',
    subgroupExtTitle: 'Yes',
    Status: Status.Active,
    groupIds: [2, 10, 11, 12, 13, 20, 21, 23, 25, 28, 32, 33, 34, 35, 36],
  },
  {
    subgroupApiTitle: 'No',
    subgroupExtTitle: 'No',
    Status: Status.Active,
    groupIds: [2, 10, 11, 12, 13, 20, 21, 23, 25, 28, 32, 33, 34, 35, 36],
  },
  {
    subgroupApiTitle: 'Over',
    subgroupExtTitle: 'Over',
    Status: Status.Active,
    groupIds: [3, 4, 5, 6, 7, 8, 17, 22, 24, 29, 30, 31, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
  },
  {
    subgroupApiTitle: 'Under',
    subgroupExtTitle: 'Under',
    Status: Status.Active,
    groupIds: [3, 4, 5, 6, 7, 8, 17, 22, 24, 29, 30, 31, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
  },
  {
    subgroupApiTitle: 'Total',
    subgroupExtTitle: 'Total',
    Status: Status.Active,
    groupIds: [],
  },
  {
    subgroupApiTitle: 'Over 1.5',
    subgroupExtTitle: 'Over 1.5',
    Status: Status.Active,
    groupIds: [15],
  },
  {
    subgroupApiTitle: 'Under 1.5',
    subgroupExtTitle: 'Under 1.5',
    Status: Status.Active,
    groupIds: [15],
  },
  {
    subgroupApiTitle: 'Over 2.5',
    subgroupExtTitle: 'Over 2.5',
    Status: Status.Active,
    groupIds: [15],
  },
  {
    subgroupApiTitle: 'Under 2.5',
    subgroupExtTitle: 'Under 2.5',
    Status: Status.Active,
    groupIds: [15],
  },
]

export const getSportIds = (sports: string[], data: Record<string, string | number>[]): { sportId: number }[] => {
  return sports.map((name) => {
    let sprtId: number = 0
    data.forEach(({ sportName, sportId }) => {
      if (sportName?.toString()?.toLowerCase() === name?.toLowerCase()) sprtId = parseInt('' + sportId)
    })
    return { sportId: sprtId }
  })
}

export const replaceCategoryWithId = (
  catData: Record<string, string | number>[],
  categoriesArray: any,
  catgData: Record<string, string | number>[],
): Record<string, string | number>[] => {
  return catData.map((rd) => {
    let spRd: Record<string, string | number> = {}
    catgData.forEach(({ categoryApiTitle, categoryExtTitle, depth, categoryId }) => {
      const cg = categoriesArray[parseInt('' + rd.categoryId) - 1]
      if (
        cg?.categoryApiTitle === categoryApiTitle &&
        cg?.categoryExtTitle === categoryExtTitle &&
        cg?.depth === depth
      ) {
        rd.categoryId = categoryId
        spRd = rd
      }
    })
    return spRd
  })
}

export const replaceGroupId = (
  grpIds: number[],
  groupD: any,
  groupsD: Record<string, string | number>[],
): { groupId: number }[] => {
  return grpIds.map((id: number) => {
    const grpDt = groupD[id - 1]
    let grpId: number = 0
    groupsD.forEach(({ groupApiTitle, groupExtTitle, groupId }) => {
      if (groupApiTitle === grpDt?.groupApiTitle && groupExtTitle === grpDt?.groupExtTitle) {
        grpId = parseInt('' + groupId)
      }
    })
    return { groupId: grpId }
  })
}

export const replaceSportWithId = (
  rawData: Record<string, string | number>[],
  sportData: Record<string, string | number>[],
): Record<string, string | number>[] => {
  return rawData.map((rd) => {
    let spRd: Record<string, string | number> = {}
    sportData.forEach(({ sportName, sportId }) => {
      if (rd?.sport?.toString()?.toLowerCase() === sportName?.toString()?.toLowerCase()) {
        rd.sportId = sportId
        delete rd.sport
        spRd = rd
      }
    })
    return spRd
  })
}

const seedCategoriesGroupsSubgroups = async (): Promise<void> => {
  const sportData = await sports.findMany({
    select: {
      sportId: true,
      sportName: true,
    },
  })

  const categoriesData = [
    {
      sportInCategory: {
        createMany: { data: getSportIds(['baseball', 'basketball', 'mma', 'football', 'soccer'], sportData) },
      },
      categoryApiTitle: 'Home/Away',
      categoryExtTitle: 'Home Away',
      depth: CategoryDepth.Game,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['basketball'], sportData) },
      },
      categoryApiTitle: 'Home/Away',
      categoryExtTitle: 'Home Away',
      depth: CategoryDepth.Team,
      status: Status.Inactive,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['baseball', 'basketball', 'football', 'soccer'], sportData) },
      },
      categoryApiTitle: 'Over/Under',
      categoryExtTitle: 'Over Under',
      depth: CategoryDepth.Team,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['baseball', 'basketball', 'mma', 'football', 'soccer'], sportData) },
      },
      categoryApiTitle: 'Over/Under',
      categoryExtTitle: 'Over Under',
      depth: CategoryDepth.Game,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['baseball', 'basketball', 'football'], sportData) },
      },
      categoryApiTitle: 'Over/Under',
      categoryExtTitle: 'Over Under',
      depth: CategoryDepth.Player,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['basketball', 'football', 'soccer'], sportData) },
      },
      categoryApiTitle: 'Call it',
      categoryExtTitle: 'Call it',
      depth: CategoryDepth.Game,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['basketball', 'mma'], sportData) },
      },
      categoryApiTitle: 'Home/Away',
      categoryExtTitle: 'Home Away',
      depth: CategoryDepth.Player,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['soccer', 'football'], sportData) },
      },
      categoryApiTitle: 'Call it',
      categoryExtTitle: 'Call it',
      depth: CategoryDepth.Team,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['soccer', 'football'], sportData) },
      },
      categoryApiTitle: 'Call it',
      categoryExtTitle: 'Call it',
      depth: CategoryDepth.Player,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['baseball', 'basketball', 'soccer', 'football'], sportData) },
      },
      categoryApiTitle: 'Spread',
      categoryExtTitle: 'Spread',
      depth: CategoryDepth.Game,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['baseball', 'basketball', 'soccer', 'football'], sportData) },
      },
      categoryApiTitle: 'Total',
      categoryExtTitle: 'Total',
      depth: CategoryDepth.Team,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['football', 'basketball', 'baseball', 'soccer', 'mma'], sportData) },
      },
      categoryApiTitle: 'Moneyline',
      categoryExtTitle: 'Moneyline',
      depth: CategoryDepth.Game,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['baseball', 'basketball', 'soccer', 'football', 'mma'], sportData) },
      },
      categoryApiTitle: 'Main',
      categoryExtTitle: 'Main',
      depth: CategoryDepth.Game,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['soccer', 'football', 'mma'], sportData) },
      },
      categoryApiTitle: 'Totals',
      categoryExtTitle: 'Totals',
      depth: CategoryDepth.Game,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['soccer', 'football', 'baseball'], sportData) },
      },
      categoryApiTitle: 'Totals',
      categoryExtTitle: 'Totals',
      depth: CategoryDepth.Team,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['mma', 'football'], sportData) },
      },
      categoryApiTitle: 'Totals',
      categoryExtTitle: 'Totals',
      depth: CategoryDepth.Player,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['soccer', 'football'], sportData) },
      },
      categoryApiTitle: 'Halves',
      categoryExtTitle: 'Halves',
      depth: CategoryDepth.Game,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['baseball', 'football'], sportData) },
      },
      categoryApiTitle: 'Player Props',
      categoryExtTitle: 'Player Props',
      depth: CategoryDepth.Player,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['football'], sportData) },
      },
      categoryApiTitle: 'Quarters',
      categoryExtTitle: 'Quarters',
      depth: CategoryDepth.Game,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['football'], sportData) },
      },
      categoryApiTitle: 'Quarters',
      categoryExtTitle: 'Quarters',
      depth: CategoryDepth.Team,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['basketball', 'baseball', 'soccer'], sportData) },
      },
      categoryApiTitle: 'Extras',
      categoryExtTitle: 'Extras',
      depth: CategoryDepth.Game,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['football'], sportData) },
      },
      categoryApiTitle: 'Extras',
      categoryExtTitle: 'Extras',
      depth: CategoryDepth.Team,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
    {
      sportInCategory: {
        createMany: { data: getSportIds(['football', 'basketball', 'baseball', 'soccer', 'mma'], sportData) },
      },
      categoryApiTitle: 'Main',
      categoryExtTitle: 'Main',
      depth: CategoryDepth.Player,
      status: Status.Active,
      challengeMode: {
        OneVsOne: true,
        Group: true,
      },
    },
  ]

  for (const cat of categoriesData) {
    const catResp = await categories.findFirst({
      where: {
        categoryApiTitle: cat.categoryApiTitle,
        categoryExtTitle: cat.categoryExtTitle,
        depth: cat.depth,
      },
    })
    if (!catResp) {
      await categories.create({
        data: cat,
      })
    } else {
      await categories.update({
        where: {
          category_depth: {
            categoryApiTitle: catResp.categoryApiTitle,
            depth: catResp.depth,
          },
        },
        data: {
          ...cat,
          sportInCategory: {
            connectOrCreate: cat.sportInCategory.createMany.data.map((eachSportId) => ({
              where: {
                categoryId_sportId: {
                  categoryId: catResp.categoryId,
                  ...eachSportId,
                },
              },
              create: {
                ...eachSportId,
              },
            })),
          },
        },
      })
    }
  }

  const categoriesList = await categories.findMany({
    select: {
      categoryId: true,
      categoryApiTitle: true,
      categoryExtTitle: true,
      depth: true,
    },
  })

  const groupsData = [
    {
      groupApiTitle: 'Winning Team',
      groupExtTitle: 'Winning Team',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'basketball',
          attribute: 'total',
        },
        {
          sport: 'baseball',
          attribute: 'total',
        },
        {
          sport: 'football',
          attribute: 'total',
        },
        {
          sport: 'soccer',
          attribute: 'goals',
        },
      ],
      apiCategoryId: {
        nba: '2',
        mlb: '1',
        nfl: '1',
        soccer: '2',
      },
      logicCode: 'G000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 1,
            sport: 'basketball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 1,
            sport: 'baseball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 1,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 1,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 13,
            sport: 'baseball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 13,
            sport: 'basketball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 13,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 13,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Overtime',
      groupExtTitle: 'Overtime',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'basketball',
          attribute: 'overtime',
        },
        {
          sport: 'football',
          attribute: 'overtime',
        },
      ],
      apiCategoryId: {
        nba: '34',
        mlb: '',
        nfl: '12',
      },
      logicCode: 'G000011',
      categoriesGroups: {
        create: [
          {
            categoryId: 6,
            sport: 'basketball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 6,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 21,
            sport: 'baseball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 21,
            sport: 'basketball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 21,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total - Home',
      groupExtTitle: 'Total - Home',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'basketball',
          attribute: 'total',
        },
        {
          sport: 'baseball',
          attribute: 'total',
        },
        {
          sport: 'football',
          attribute: 'total',
        },
        {
          sport: 'soccer',
          attribute: 'goals',
        },
      ],
      apiCategoryId: {
        nba: '100',
        mlb: '7',
        nfl: '8',
        soccer: '16',
      },
      logicCode: 'T000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 3,
            sport: 'basketball',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 3,
            sport: 'baseball',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 3,
            sport: 'football',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 3,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 11,
            sport: 'baseball',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 11,
            sport: 'basketball',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 11,
            sport: 'football',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 11,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total - Away',
      groupExtTitle: 'Total - Away',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'basketball',
          attribute: 'total',
        },
        {
          sport: 'baseball',
          attribute: 'total',
        },
        {
          sport: 'football',
          attribute: 'total',
        },
        {
          sport: 'soccer',
          attribute: 'goals',
        },
      ],
      apiCategoryId: {
        nba: '101',
        mlb: '8',
        nfl: '9',
        soccer: '17',
      },
      logicCode: 'T000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 3,
            sport: 'basketball',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 3,
            sport: 'baseball',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 3,
            sport: 'football',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 3,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 11,
            sport: 'baseball',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 11,
            sport: 'basketball',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 11,
            sport: 'football',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 11,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Number of Fouls',
      groupExtTitle: 'Total Number of Fouls',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'basketball',
          attribute: 'pfouls',
        },
        {
          sport: 'football',
          attribute: 'penalities',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'T000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 3,
            sport: 'basketball',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 3,
            sport: 'football',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 15,
            sport: 'baseball',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Game Score (Home+Away)',
      groupExtTitle: 'Total Game Score (Home+Away)',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'basketball',
          attribute: 'total',
        },
        {
          sport: 'baseball',
          attribute: 'total',
        },
        {
          sport: 'football',
          attribute: 'total',
        },
        {
          sport: 'soccer',
          attribute: 'goals',
        },
      ],
      apiCategoryId: {
        nba: '4',
        mlb: '5',
        nfl: '3',
        soccer: '5',
      },
      logicCode: 'G000003',
      categoriesGroups: {
        create: [
          {
            categoryId: 4,
            sport: 'basketball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 4,
            sport: 'baseball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 4,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 4,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 13,
            sport: 'basketball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 13,
            sport: 'baseball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 13,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 13,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Points',
      groupExtTitle: 'Total Points',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'basketball',
          attribute: 'points',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'P000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 5,
            sport: 'basketball',
            depth: CategoryDepth.Player,
          },
          {
            categoryId: 18,
            sport: 'baseball',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Hits - Home',
      groupExtTitle: 'Total Hits - Home',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'baseball',
          attribute: 'hits',
        },
      ],
      apiCategoryId: {
        mlb: '61',
      },
      logicCode: 'T000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 3,
            sport: 'baseball',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 11,
            sport: 'baseball',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Winning Team - Spread',
      groupExtTitle: 'Winning Team - Spread',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'basketball',
          attribute: 'total',
        },
        {
          sport: 'baseball',
          attribute: 'total',
        },
        {
          sport: 'football',
          attribute: 'total',
        },
        {
          sport: 'soccer',
          attribute: 'goals',
        },
      ],
      apiCategoryId: {
        nba: '3',
        mlb: '2',
        nfl: '2',
        soccer: '4',
      },
      logicCode: 'G000002',
      categoriesGroups: {
        create: [
          {
            categoryId: 1,
            sport: 'basketball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 1,
            sport: 'baseball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 1,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 1,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 10,
            sport: 'basketball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 10,
            sport: 'baseball',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 10,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 10,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Win by KO/TKO/DQ',
      groupExtTitle: 'Win by KO/TKO/DQ',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'mma',
          attribute: 'won_type',
        },
      ],
      apiCategoryId: {
        mma: ['18', '20'],
      },
      logicCode: 'P000002',
      categoriesGroups: {
        create: [
          {
            categoryId: 7,
            sport: 'mma',
            depth: CategoryDepth.Player,
          },
          {
            categoryId: 23,
            sport: 'mma',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Win by Submission',
      groupExtTitle: 'Win by Submission',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'mma',
          attribute: 'won_type',
        },
      ],
      apiCategoryId: {
        mma: ['17', '19'],
      },
      logicCode: 'P000002',
      categoriesGroups: {
        create: [
          {
            categoryId: 7,
            sport: 'mma',
            depth: CategoryDepth.Player,
          },
          {
            categoryId: 23,
            sport: 'mma',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'End in the 1st 60 Seconds',
      groupExtTitle: 'Fight To end in 1st 60 Seconds',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'mma',
          attribute: 'minutes',
        },
      ],
      apiCategoryId: {
        mma: '27',
      },
      logicCode: 'G000004',
      categoriesGroups: {
        create: [
          {
            categoryId: 1,
            sport: 'mma',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 13,
            sport: 'mma',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Fight To Go the Distance',
      groupExtTitle: 'Fight To Go the Distance',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'mma',
          attribute: 'won_type',
        },
      ],
      apiCategoryId: {
        mma: '5',
      },
      logicCode: 'G000005',
      categoriesGroups: {
        create: [
          {
            categoryId: 1,
            sport: 'mma',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 13,
            sport: 'mma',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Home/Away',
      groupExtTitle: 'Winning Fighter',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'mma',
          attribute: 'winner',
        },
      ],
      apiCategoryId: {
        mma: '2',
      },
      logicCode: 'P000003',
      categoriesGroups: {
        create: [
          {
            categoryId: 7,
            sport: 'mma',
            depth: CategoryDepth.Player,
          },
          {
            categoryId: 13,
            sport: 'mma',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Over/Under',
      groupExtTitle: 'Fight Rounds By Duration',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'mma',
          attribute: 'minutes',
        },
      ],
      apiCategoryId: {
        mma: '4',
      },
      logicCode: 'G000006',
      categoriesGroups: {
        create: [
          {
            categoryId: 4,
            sport: 'mma',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 13,
            sport: 'mma',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Round Betting',
      groupExtTitle: 'Fight Ends in Round',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'mma',
          attribute: 'round',
        },
      ],
      apiCategoryId: {
        mma: '6',
      },
      logicCode: 'G000007',
      categoriesGroups: {
        create: [
          {
            categoryId: 1,
            sport: 'mma',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 14,
            sport: 'mma',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Hits - Away',
      groupExtTitle: 'Total Hits - Away',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'baseball',
          attribute: 'hits',
        },
      ],
      apiCategoryId: {
        mlb: '60',
      },
      logicCode: 'T000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 3,
            sport: 'baseball',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 11,
            sport: 'baseball',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Second Half Winner',
      groupExtTitle: 'Second Half Winner',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'soccer',
          attribute: 'fulltime',
        },
      ],
      apiCategoryId: {
        soccer: '3',
      },
      logicCode: 'G000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 1,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 15,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Win to Nil - Home/Away',
      groupExtTitle: 'Winning Team to Nil',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'soccer',
          attribute: 'goals',
        },
      ],
      apiCategoryId: {
        soccer: ['29', '30'],
      },
      logicCode: 'G000008',
      categoriesGroups: {
        create: [
          {
            categoryId: 1,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 14,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Home Odd/Even',
      groupExtTitle: 'Home Total Goals : Even',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'soccer',
          attribute: 'goals',
        },
      ],
      apiCategoryId: {
        soccer: '23',
      },
      logicCode: 'T000002',
      categoriesGroups: {
        create: [
          {
            categoryId: 8,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 14,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Away Odd/Even',
      groupExtTitle: 'Away Total Goals : Even',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'soccer',
          attribute: 'goals',
        },
      ],
      apiCategoryId: {
        soccer: '60',
      },
      logicCode: 'T000002',
      categoriesGroups: {
        create: [
          {
            categoryId: 8,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 14,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Goalkeeper Saves Home/Away',
      groupExtTitle: 'Saves By Goalkeeper',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'soccer',
          attribute: 'goalkeeper_saves',
        },
      ],
      apiCategoryId: {
        soccer: ['268', '274'],
      },
      logicCode: 'T000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 3,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 15,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Game Red Cards',
      groupExtTitle: 'Game Red Cards (Y/N)',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'soccer',
          attribute: 'red_cards',
        },
      ],
      apiCategoryId: {
        soccer: '86',
      },
      logicCode: 'G000009',
      categoriesGroups: {
        create: [
          {
            categoryId: 6,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 21,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Yellow Cards',
      groupExtTitle: 'Total Yellow Cards',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'soccer',
          attribute: 'yellow_cards',
        },
      ],
      apiCategoryId: {
        soccer: ['150', '151'],
      },
      logicCode: 'T000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 3,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
          {
            categoryId: 15,
            sport: 'soccer',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Player Red Cards',
      groupExtTitle: 'Red Cards (Y/N)',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'soccer',
          attribute: 'cards_red',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'P000004',
      categoriesGroups: {
        create: [
          {
            categoryId: 9,
            sport: 'soccer',
            depth: CategoryDepth.Player,
          },
          {
            categoryId: 21,
            sport: 'soccer',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Correct Score - First Half',
      groupExtTitle: 'Correct Score - First Half',
      status: Status.Inactive,
      groupAttributes: [
        {
          sport: 'soccer',
          attribute: 'halftime',
        },
      ],
      apiCategoryId: {
        soccer: '31',
        initiator: true,
      },
      logicCode: 'G000010',
      categoriesGroups: {
        create: [
          {
            categoryId: 1,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 17,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Correct Score - Second Half',
      groupExtTitle: 'Correct Score - Second Half',
      status: Status.Inactive,
      groupAttributes: [
        {
          sport: 'soccer',
          attribute: 'fulltime',
        },
      ],
      apiCategoryId: {
        soccer: '62',
        initiator: true,
      },
      logicCode: 'G000010',
      categoriesGroups: {
        create: [
          {
            categoryId: 1,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
          {
            categoryId: 17,
            sport: 'soccer',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'First Player to Score',
      groupExtTitle: 'First Player to Score',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'soccer',
          attribute: 'goal_time',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'P000005',
      categoriesGroups: {
        create: [
          {
            categoryId: 9,
            sport: 'soccer',
            depth: CategoryDepth.Player,
          },
          {
            categoryId: 21,
            sport: 'soccer',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Game Score (Home+Away) By Quarter',
      groupExtTitle: 'Total Game Score (Home+Away) By Quarter',
      status: Status.Inactive,
      groupAttributes: [
        {
          sport: 'football',
          attribute: ['quarter_1', 'quarter_2', 'quarter_3', 'quarter_4'],
        },
      ],
      apiCategoryId: {
        nfl: ['20', '33', '34', '35'],
      },
      logicCode: 'G000003',
      categoriesGroups: {
        create: [
          {
            categoryId: 4,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Game Score (Home+Away) By Half',
      groupExtTitle: 'Total Game Score (Home+Away) By Half',
      status: Status.Inactive,
      groupAttributes: [
        {
          sport: 'football',
          attribute: ['half_1', 'half_2'],
        },
      ],
      apiCategoryId: {
        nfl: ['4', '30'],
      },
      logicCode: 'G000003',
      categoriesGroups: {
        create: [
          {
            categoryId: 4,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Team Total Points (1st Quarter)',
      groupExtTitle: 'Team Total Points (1st Quarter)',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'quarter_1',
        },
      ],
      apiCategoryId: {
        nfl: ['26', '27'],
      },
      logicCode: 'T000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 3,
            sport: 'football',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Highest Scoring Half',
      groupExtTitle: 'Highest Scoring Half',
      status: Status.Inactive,
      groupAttributes: [
        {
          sport: 'football',
          attribute: ['half_1', 'half_2'],
        },
      ],
      apiCategoryId: {
        nfl: ['31', '31'],
      },
      logicCode: 'G000012',
      categoriesGroups: {
        create: [
          {
            categoryId: 6,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Highest Scoring Quarter',
      groupExtTitle: 'Highest Scoring Quarter',
      status: Status.Inactive,
      groupAttributes: [
        {
          sport: 'football',
          attribute: ['quarter_1', 'quarter_2', 'quarter_3', 'quarter_4'],
        },
      ],
      apiCategoryId: {
        nfl: ['41', '41', '41', '41'],
      },
      logicCode: 'G000013',
      categoriesGroups: {
        create: [
          {
            categoryId: 6,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Anytime Goal Scorer',
      groupExtTitle: 'Anytime Goal Scorer',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'type',
        },
      ],
      apiCategoryId: {
        nfl: '47',
      },
      logicCode: 'P000006',
      categoriesGroups: {
        create: [
          {
            categoryId: 9,
            sport: 'football',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'First Goal Scorer',
      groupExtTitle: 'First Goal Scorer',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'type',
        },
      ],
      apiCategoryId: {
        nfl: '52',
      },
      logicCode: 'P000007',
      categoriesGroups: {
        create: [
          {
            categoryId: 9,
            sport: 'football',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'First Team to Score',
      groupExtTitle: 'First Team to Score',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'type',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'T000003',
      categoriesGroups: {
        create: [
          {
            categoryId: 8,
            sport: 'football',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Yards by Team',
      groupExtTitle: 'Total Yards by Team',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'yards_total',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'T000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 3,
            sport: 'football',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Penalties',
      groupExtTitle: 'Total Penalties',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'penalties_total',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'G000003',
      categoriesGroups: {
        create: [
          {
            categoryId: 4,
            sport: 'football',
            depth: CategoryDepth.Game,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Sacks',
      groupExtTitle: 'Total Sacks',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'sacks_total',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'T000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 3,
            sport: 'football',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Completed Passes By Team',
      groupExtTitle: 'Completed Passes',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'passing_comp_att',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'T000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 3,
            sport: 'football',
            depth: CategoryDepth.Team,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Completed Passes By Player',
      groupExtTitle: 'Completed Passes',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'passing_comp_att',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'P000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 5,
            sport: 'football',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Passing Touch downs',
      groupExtTitle: 'Total Passing Touch downs',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'passing_touch_downs',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'P000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 5,
            sport: 'football',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Passing Yards by Player',
      groupExtTitle: 'Total Passing Yards by Player',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'passing_yards',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'P000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 5,
            sport: 'football',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Rushing touch downs',
      groupExtTitle: 'Total Rushing touch downs',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'rushing_touch_downs',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'P000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 5,
            sport: 'football',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Total Sacks by Player',
      groupExtTitle: 'Total Sacks by Player',
      status: Status.Active,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'passing_sacks',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'P000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 5,
            sport: 'football',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
    {
      groupApiTitle: 'Tackle For Loss',
      groupExtTitle: 'Tackle For Loss',
      status: Status.Inactive,
      groupAttributes: [
        {
          sport: 'football',
          attribute: 'defensive_tfl',
        },
      ],
      apiCategoryId: {
        others: 9999,
      },
      logicCode: 'P000001',
      categoriesGroups: {
        create: [
          {
            categoryId: 5,
            sport: 'football',
            depth: CategoryDepth.Player,
          },
        ],
      },
    },
  ]

  for (const grp of groupsData) {
    const grpResp = await groups.findFirst({
      where: {
        groupApiTitle: grp.groupApiTitle,
        groupExtTitle: grp.groupExtTitle,
      },
    })
    // @ts-expect-error dynamic replacement of sport to sportId
    grp.groupAttributes = replaceSportWithId(grp.groupAttributes, sportData)
    // @ts-expect-error dynamic replacement of sport to sportId
    grp.categoriesGroups.create = replaceSportWithId(grp.categoriesGroups.create, sportData)
    // @ts-expect-error dynamic replacement of category to categoryId
    grp.categoriesGroups.create = replaceCategoryWithId(grp.categoriesGroups.create, categoriesData, categoriesList)

    if (!grpResp) {
      await groups.create({
        data: grp,
      })
    } else {
      await groups.update({
        where: {
          groupId: grpResp.groupId,
        },
        data: {
          ...grp,
          categoriesGroups: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            connectOrCreate: grp.categoriesGroups.create.map((eachCg: any) => ({
              where: {
                categoryId_groupId_sportId: {
                  categoryId: eachCg.categoryId,
                  groupId: grpResp.groupId,
                  sportId: eachCg.sportId,
                },
              },
              create: {
                categoryId: eachCg.categoryId,
                sportId: eachCg.sportId,
                depth: eachCg.depth,
              },
            })),
          },
        },
      })
    }
  }

  const groupsList = await groups.findMany({
    select: {
      groupApiTitle: true,
      groupExtTitle: true,
      groupId: true,
    },
  })

  for (const sg of subgroupsData) {
    const sgResp = await subgroups.findFirst({
      where: {
        subgroupApiTitle: sg.subgroupApiTitle,
        subgroupExtTitle: sg.subgroupExtTitle,
      },
    })
    const groupIds = replaceGroupId(sg.groupIds, groupsData, groupsList)
    if (!sgResp) {
      await subgroups.create({
        data: {
          GroupsSubgroups: {
            create: groupIds,
          },
          subgroupApiTitle: sg.subgroupApiTitle,
          subgroupExtTitle: sg.subgroupApiTitle,
          status: sg.Status,
        },
      })
    } else {
      await subgroups.update({
        where: {
          subgroupId: sgResp.subgroupId,
        },
        data: {
          GroupsSubgroups: {
            connectOrCreate: groupIds.map((grupId: { groupId: number }) => ({
              where: {
                groupId_subgroupId: {
                  subgroupId: sgResp.subgroupId,
                  ...grupId,
                },
              },
              create: {
                ...grupId,
              },
            })),
          },
          subgroupApiTitle: sg.subgroupApiTitle,
          subgroupExtTitle: sg.subgroupApiTitle,
          status: sg.Status,
        },
      })
    }
  }
}

export default seedCategoriesGroupsSubgroups
