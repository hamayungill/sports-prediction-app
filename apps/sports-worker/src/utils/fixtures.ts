export const betOddsKafkaMessage = {
  event_name: 'mma-push',
  data: {
    sport_id: 3,
    api_source_id: 3,
    game_id: 1685,
    data: [
      {
        sportId: 3,
        gameId: 1685,
        bookmakerId: 32,
        apiCategoryId: '2',
        oddsType: 'Away',
        decimalOddsValue: 2.7,
        apiLastUpdated: '2024-09-26 00:05:15.359843',
        updatedAt: '2024-09-26 00:05:15.359853',
        status: 'Active',
        moneyline: 170.00000000000003,
        fraction: '17/10',
        indonesian: 1.7000000000000002,
        hongkong: 1.7000000000000002,
        malaysian: -0.588235294117647,
      },
    ],
  },
  schema_name: 'challenge',
  sport_name: 'MMA',
  table: 'bet_odds',
}

export const gameOddsKafkaMessage = {
  event_name: 'mma-push',
  data: {
    apiSourceId: 3,
    gameDate: '2024-09-28T16:00:00Z',
    homeTeamName: 'Nora Cornolle',
    awayTeamName: 'Jacqueline Cavalcanti',
    bookmakerTitle: 'DraftKings',
    homeTeamId: 1753,
    awayTeamId: 1727,
    gameId: 12281,
    odds: [
      {
        oddsType: 'h2h',
        home: null,
        away: null,
      },
    ],
    createdAt: '2024-09-25 19:52:14.543664',
    updatedAt: '2024-09-25 19:52:14.543681',
  },
  schema_name: 'challenge',
  sport_name: 'MMA',
  table: 'odds',
}

export const gameStatsKafkaMessage = {
  event_name: 'mma-push',
  data: {
    sportId: 3,
    gameStats: {
      id: 1482,
      stage: 'main',
      week: 'None',
      day: 'None',
      startDate: '2024-07-14T03:00:00+00:00',
      status: 'Closed',
      statistics: {
        strikes: {
          total: {
            head: 307,
            body: 57,
            legs: 14,
          },
          power: {
            head: 101,
            body: 39,
            legs: 13,
          },
          takedowns: {
            attempt: 14,
            landed: 5,
          },
          submissions: 0,
          knockdowns: 0,
        },
        won_type: 'Points',
        round: 3,
        minute: '5:00',
        ko_type: 'None',
        target: 'None',
        sub_type: 'None',
      },
      teams: {
        away: {
          id: 2412,
          name: 'Ange Loosa',
          logo: 'https://media.api-sports.io/mma/fighters/2412.png',
          winner: false,
          scores: [
            {
              Round_0: '27',
            },
            {
              Round_1: '27',
            },
            {
              Round_2: '28',
            },
          ],
        },
        home: {
          id: 2551,
          name: 'Gabriel Bonfim',
          logo: 'https://media.api-sports.io/mma/fighters/2551.png',
          winner: true,
          scores: [
            {
              Round_0: '30',
            },
            {
              Round_1: '30',
            },
            {
              Round_2: '29',
            },
          ],
        },
      },
    },
    apiGameId: '1482',
  },
  schema_name: 'sport',
  sport_name: 'MMA',
  table: 'game_stats',
}

export const gamesKafkaMessage = {
  event_name: 'mma-push',
  data: {
    seasonId: 15,
    apiGameId: '1197',
    data: {
      id: 1197,
      date: '2024-02-25T04:00:00+00:00',
      time: '04:00',
      timestamp: 1708833600,
      timezone: 'UTC',
      slug: 'UFC Fight Night: Moreno vs. Royval 2',
      is_main: true,
      category: 'Bantamweight',
      status: 'Scheduled',
      stage: 'main',
      api_source_id: 3,
      sport_id: 3,
      sport_name: 'MMA',
      league_id: 15,
      ori_status: {
        long: 'Pre-Fight',
        short: 'PF',
      },
      teams: {
        away: {
          id: 2251,
          name: 'Ricky Turcios',
          logo: 'https://media.api-sports.io/mma/fighters/2251.png',
          winner: false,
          abbreviation: 'RT',
        },
        home: {
          id: 2512,
          name: 'Raul Rosas Jr.',
          logo: 'https://media.api-sports.io/mma/fighters/2512.png',
          winner: false,
          abbreviation: 'RRJ',
        },
      },
    },
    apiSourceId: 3,
    processingStatus: 'Pending',
    sportId: 3,
    internalAwayTeamId: 43,
    internalHomeTeamId: 56,
  },
  schema_name: 'sport',
  sport_name: 'MMA',
  table: 'games',
}

export const leagueKafkaMessage = {
  event_name: 'mma-push',
  data: {
    leagueName: 'Flyweight',
    sportId: 3,
    apiLeagueId: 'None',
  },
  table: 'leagues',
  schema_name: 'sport',
  sport_name: 'MMA',
}

export const playerKafkaMessage = {
  event_name: 'mma-push',
  data: {
    firstName: 'Mallory',
    lastName: 'Martin',
    apiPlayerId: '635',
    apiTeamId: '19',
    data: {
      id: 635,
      name: 'Mallory Martin',
      nickname: 'None',
      photo: 'https://media.api-sports.io/mma/fighters/635.png',
      gender: 'W',
      birth_date: '1999-11-30',
      age: 27,
      height: "5' 4'",
      weight: '115 lbs',
      reach: "63'",
      stance: 'Orthodox',
      category: "Women's Strawweight",
      team: {
        id: 19,
        name: 'Elevation Fight',
      },
      last_update: '2023-08-30T17:13:32+00:00',
      api_team_id: 19,
      sport_id: 3,
      league_id: 21,
    },
    isActive: true,
    sportId: 3,
    internalTeamId: 70,
    interanlSeasonId: 1,
    internalTeamData: {
      teamName: 'Jackson-Wink MMA',
      apiTeamId: '55',
      status: 'Active',
      sportId: 3,
      internalLeagueId: 6,
    },
  },
  schema_name: 'sport',
  sport_name: 'MMA',
  table: 'players',
}

export const playerStatsKafkaMessgae = {
  event_name: 'mma-push',
  data: {
    apiGameId: '1560',
    apiPlayerId: '915',
    sportId: 3,
    playerStats: {
      id: 1560,
      player: {
        id: 915,
        firstname: 'Aoriqileng',
        lastname: '',
      },
      statistics: {
        winner: false,
        won_type: 'Points',
        strikes: {
          total: {
            head: 43,
            body: 11,
            legs: 0,
          },
          power: {
            head: 12,
            body: 10,
            legs: 0,
          },
          takedowns: {
            attempt: 0,
            landed: 0,
          },
          submissions: 0,
          control_time: '0:00',
          knockdowns: 0,
        },
      },
      sport_name: 'MMA',
      sport_id: 3,
    },
  },
  schema_name: 'sport',
  sport_name: 'MMA',
  table: 'player_stats',
}

export const seasonKafkaMessage = {
  event_name: 'mma-push',
  data: {
    leagueId: 8,
    season: 2024,
    status: 'Active',
  },
  schema_name: 'sport',
  sport_name: 'MMA',
  table: 'seasons',
}

export const teamKafkaMessage = {
  event_name: 'mma-push',
  data: {
    teamName: 'Fortis MMA',
    apiTeamId: '2',
    status: 'Active',
    sportId: 3,
    internalLeagueId: 6,
  },
  schema_name: 'sport',
  sport_name: 'MMA',
  table: 'teams',
}

export const teamStatsKafkaMessage = {
  event_name: 'mma-push',
  data: {
    sportId: 3,
    teamStats: {
      team: {
        id: 12,
        logo: 'https://media.api-sports.io/football/teams/12.png',
        name: 'Japan',
        winner: true,
        abbreviation: 'JAP',
      },
      statistics: {
        goals: 5,
        penalty: null,
        fulltime: 5,
        halftime: 0,
        extratime: null,
      },
    },
    apiGameId: '1482',
    apiTeamId: '12',
  },
  schema_name: 'sport',
  sport_name: 'MMA',
  table: 'team_stats',
}
