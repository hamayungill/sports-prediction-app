import prismaClient, { Prisma } from '../../index'

const { bookmakers, sports } = prismaClient

export const prepareBookmakersData = async (): Promise<Prisma.Bookmakers[]> => {
  const bookmakersData = []
  const baseballSport = await sports.findFirst({
    where: {
      sportName: 'Baseball',
    },
    select: {
      sportId: true,
    },
  })
  if (baseballSport) {
    const { sportId } = baseballSport
    bookmakersData.push(
      {
        sportId,
        bookmakerName: '1xbet',
        bookmakerApiId: 1,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Bet365',
        bookmakerApiId: 2,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: '5Dimes',
        bookmakerApiId: 3,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Pinnacle',
        bookmakerApiId: 4,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'SBO',
        bookmakerApiId: 5,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Bovada',
        bookmakerApiId: 6,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betcris',
        bookmakerApiId: 7,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Bwin',
        bookmakerApiId: 8,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: '10Bet',
        bookmakerApiId: 9,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Marathon',
        bookmakerApiId: 10,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Unibet',
        bookmakerApiId: 11,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Intertops',
        bookmakerApiId: 12,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betfair',
        bookmakerApiId: 13,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Ladbrokes',
        bookmakerApiId: 14,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Tipico',
        bookmakerApiId: 15,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: '888Sport',
        bookmakerApiId: 16,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Dafabet',
        bookmakerApiId: 17,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Sportingbet',
        bookmakerApiId: 18,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betway',
        bookmakerApiId: 19,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Expekt',
        bookmakerApiId: 20,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betsson',
        bookmakerApiId: 21,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'WilliamHill',
        bookmakerApiId: 22,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'NordicBet',
        bookmakerApiId: 23,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'ComeOn',
        bookmakerApiId: 24,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: '188bet',
        bookmakerApiId: 25,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Netbet',
        bookmakerApiId: 26,
        logoUrl: '',
      },
    )
  }
  const mmaSport = await sports.findFirst({
    where: {
      sportName: 'MMA',
    },
    select: {
      sportId: true,
    },
  })
  if (mmaSport) {
    const { sportId } = mmaSport
    bookmakersData.push(
      {
        sportId,
        bookmakerName: 'Marathon',
        bookmakerApiId: 1,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'bwin',
        bookmakerApiId: 2,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'NordicBet',
        bookmakerApiId: 3,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: '10Bet',
        bookmakerApiId: 4,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'bet365',
        bookmakerApiId: 5,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Unibet',
        bookmakerApiId: 6,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betsson',
        bookmakerApiId: 7,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: '188bet',
        bookmakerApiId: 8,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Pncl',
        bookmakerApiId: 9,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'ComeOn',
        bookmakerApiId: 10,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betway',
        bookmakerApiId: 11,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betcris',
        bookmakerApiId: 12,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: '888Sport',
        bookmakerApiId: 13,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Sbo',
        bookmakerApiId: 14,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Tipico',
        bookmakerApiId: 16,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Sportingbet',
        bookmakerApiId: 17,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betfair',
        bookmakerApiId: 18,
        logoUrl: '',
      },
    )
  }
  const soccerSport = await sports.findFirst({
    where: {
      sportName: 'Soccer',
    },
    select: {
      sportId: true,
    },
  })
  if (soccerSport) {
    const { sportId } = soccerSport
    bookmakersData.push(
      {
        sportId,
        bookmakerName: '10Bet',
        bookmakerApiId: 1,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Marathonbet',
        bookmakerApiId: 2,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betfair',
        bookmakerApiId: 3,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Pinnacle',
        bookmakerApiId: 4,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'SBO',
        bookmakerApiId: 5,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Bwin',
        bookmakerApiId: 6,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'William Hill',
        bookmakerApiId: 7,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Bet365',
        bookmakerApiId: 8,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Dafabet',
        bookmakerApiId: 9,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Ladbrokes',
        bookmakerApiId: 10,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: '1xBet',
        bookmakerApiId: 11,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'BetFred',
        bookmakerApiId: 12,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: '188Bet',
        bookmakerApiId: 13,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Interwetten',
        bookmakerApiId: 15,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Unibet',
        bookmakerApiId: 16,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: '5Dimes',
        bookmakerApiId: 17,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Intertops',
        bookmakerApiId: 18,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Bovada',
        bookmakerApiId: 19,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betcris',
        bookmakerApiId: 20,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: '888Sport',
        bookmakerApiId: 21,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Tipico',
        bookmakerApiId: 22,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Sportingbet',
        bookmakerApiId: 23,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betway',
        bookmakerApiId: 24,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Expekt',
        bookmakerApiId: 25,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betsson',
        bookmakerApiId: 26,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'NordicBet',
        bookmakerApiId: 27,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'ComeOn',
        bookmakerApiId: 28,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Netbet',
        bookmakerApiId: 30,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Betano',
        bookmakerApiId: 32,
        logoUrl: '',
      },
      {
        sportId,
        bookmakerName: 'Fonbet',
        bookmakerApiId: 33,
        logoUrl: '',
      },
    )
  }

  const footballSport = await sports.findFirst({
    where: {
      sportName: 'Football',
    },
    select: {
      sportId: true,
    },
  })
  if (footballSport) {
    const { sportId } = footballSport
    bookmakersData.push(
      {
        bookmakerApiId: 1,
        bookmakerName: 'Bwin',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 2,
        bookmakerName: '10Bet',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 3,
        bookmakerName: 'WilliamHill',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 4,
        bookmakerName: 'Bet365',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 5,
        bookmakerName: 'Marathon',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 6,
        bookmakerName: 'Unibet',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 7,
        bookmakerName: 'Pinnacle',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 8,
        bookmakerName: 'SBO',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 9,
        bookmakerName: '1xBet',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 10,
        bookmakerName: 'Sportingbet',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 11,
        bookmakerName: 'ComeOn',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 12,
        bookmakerName: 'Betway',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 13,
        bookmakerName: 'Betcris',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 14,
        bookmakerName: '888Sport',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 15,
        bookmakerName: 'NordicBet',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 16,
        bookmakerName: 'Betsson',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 17,
        bookmakerName: 'Tipico',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 18,
        bookmakerName: 'Dafabet',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 20,
        bookmakerName: 'Betfair',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 21,
        bookmakerName: 'Fonbet',
        sportId,
        logoUrl: '',
      },
      {
        bookmakerApiId: 22,
        bookmakerName: 'Betano',
        sportId,
        logoUrl: '',
      },
    )
  }
  return bookmakersData as Prisma.Bookmakers[]
}

const seedBookmakers = async (): Promise<void> => {
  const bookmakersData = await prepareBookmakersData()
  for (const bookmaker of bookmakersData) {
    const bookmakersResp = await bookmakers.findFirst({
      where: {
        bookmakerName: bookmaker.bookmakerName,
        sportId: bookmaker.sportId,
      },
    })
    if (!bookmakersResp) {
      await bookmakers.create({
        data: bookmaker,
      })
    }
  }
}

export default seedBookmakers
