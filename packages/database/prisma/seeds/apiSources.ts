import prismaClient from '../../index'

const { apiSources } = prismaClient

const apiSourcesData = [
  {
    apiSourceName: 'api-nba-v1.p.rapidapi.com',
    isActive: true,
  },
  {
    apiSourceName: 'v1.baseball.api-sports.io',
    isActive: true,
  },
  {
    apiSourceName: 'v1.mma.api-sports.io',
    isActive: true,
  },
  {
    apiSourceName: 'v1.american-football.api-sports.io',
    isActive: true,
  },
  {
    apiSourceName: 'v3.football.api-sports.io',
    isActive: true,
  },
]

const seedApiSources = async (): Promise<void> => {
  for (const source of apiSourcesData) {
    const apiSourceData = await apiSources.findFirst({
      where: {
        apiSourceName: source.apiSourceName,
      },
    })
    if (!apiSourceData) {
      await apiSources.create({
        data: {
          ...source,
        },
      })
    }
  }
}

export default seedApiSources
