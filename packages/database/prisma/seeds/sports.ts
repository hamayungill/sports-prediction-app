import prismaClient, { Prisma } from '../../index'
const { Status } = Prisma
const { sports } = prismaClient

const sportsData = [
  {
    sportName: 'Basketball',
    leagues: [
      {
        leagueName: 'NBA',
        status: Status.Active,
      },
    ],
    featureFlags: {
      pickem: {
        week: true,
        day: false,
        prize_pos: 3,
      },
      game: true,
      team: true,
      player: true,
      time_zone: 'America/New_York',
    },
  },
  {
    sportName: 'Baseball',
    leagues: [
      {
        leagueName: 'MLB',
        status: Status.Active,
        apiLeagueId: '1',
      },
    ],
    featureFlags: {
      pickem: {
        week: false,
        day: true,
        prize_pos: 3,
      },
      game: true,
      team: true,
      player: true,
      time_zone: 'America/New_York',
    },
  },
  {
    sportName: 'MMA',
    leagues: [
      {
        leagueName: 'Bantamweight',
        status: Status.Active,
      },
    ],
    featureFlags: {
      pickem: {
        week: false,
        day: true,
        prize_pos: 3,
      },
      game: true,
      team: true,
      player: true,
      time_zone: 'America/New_York',
    },
  },
  {
    sportName: 'Football',
    leagues: [
      {
        leagueName: 'NFL',
        status: Status.Active,
      },
    ],
    featureFlags: {
      pickem: {
        week: true,
        day: true,
        prize_pos: 3,
      },
      game: true,
      team: true,
      player: true,
      time_zone: 'America/New_York',
    },
  },
  {
    sportName: 'Soccer',
    leagues: [],
    featureFlags: {
      pickem: {
        week: true,
        day: false,
        prize_pos: 3,
      },
      game: true,
      team: true,
      player: true,
      time_zone: 'Europe/London',
    },
  },
]

const seedSports = async (): Promise<void> => {
  for (const sport of sportsData) {
    //Type any is used here because the leagues and sports are 2 different tables and being inserted from single query, and league is optional. If we define a custom type here for data, then while inserting (sports.update or sports.create) it will throw type mismatch error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      sportName: sport.sportName,
      featureFlags: sport.featureFlags,
    }
    if (sport.leagues.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sportData: any = await sports.findFirst({
        where: { sportName: sport.sportName },
      })

      data.leagues = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connectOrCreate: sport.leagues.map((league: any) => ({
          where: {
            sportId_leagueName: { sportId: sportData?.sportId, leagueName: league?.leagueName },
          },
          create: {
            leagueName: league.leagueName,
            status: league.status,
            apiLeagueId: league.apiLeagueId ? league.apiLeagueId : '',
          },
        })),
      }
    }
    const sportResp = await sports.findFirst({
      where: {
        sportName: {
          equals: sport.sportName,
          mode: 'insensitive',
        },
      },
    })
    if (!sportResp) {
      await sports.create({
        data,
      })
    } else {
      await sports.update({
        where: {
          sportId: sportResp.sportId,
        },
        data,
      })
    }
  }
}

export default seedSports
