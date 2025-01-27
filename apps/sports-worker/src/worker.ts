/* eslint no-case-declarations: "off" */
import prismaClient, { Prisma } from '@duelnow/database'
import {
  // IKafkaMessage,
  IKafkaMessageHeaders,
  KafkaConsumer,
  retryHandler,
  sendToRetryTopic,
  validateHeaders,
  validateMessageValue,
} from '@duelnow/kafka-client'
import { NonRetriableError, RETRY, RetriableError, Sports, TOPICS, WORKERS } from '@duelnow/utils'
import { ConsumerConfig, IHeaders, KafkaMessage } from 'kafkajs'

import { KafkaMessageValue } from './types/types'
import { KAFKA_BROKER_URLS, correlationIdMiddleware, logger } from './utils'

const { Status } = Prisma

const config: ConsumerConfig = {
  groupId: WORKERS.SPORTS,
}

const brokers = KAFKA_BROKER_URLS?.split(',') as string[]
const worker = new KafkaConsumer(brokers, config)

export const processBetOddsMessage = async (value: KafkaMessageValue): Promise<void> => {
  const { sport_name, data } = value
  let { data: oddsArr } = data
  const { sport_id: sportId, game_id: gameId } = data

  try {
    await prismaClient.betOdds.deleteMany({
      where: {
        sportId,
        gameId,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oddsArr = oddsArr.map((e: any) => {
      e.apiLastUpdated = new Date(e.apiLastUpdated)
      return e
    })

    await prismaClient.betOdds.createMany({
      data: oddsArr,
    })
    logger.debug(`${sport_name}:BetOdds:Inserted: ${JSON.stringify(data)}`)
  } catch (error) {
    logger.error(`${sport_name}:BetOdds:Error: ${error}`)
  }
}

export const processGameMessage = async (value: KafkaMessageValue): Promise<void> => {
  const { sport_name, data } = value
  const { apiGameId, sportId, internalAwayTeamId, internalHomeTeamId, startDate } = data
  delete data.internalAwayTeamId
  delete data.internalHomeTeamId

  data.startDate = new Date(startDate)

  try {
    const { gameId }: Prisma.Games = await prismaClient.games.upsert({
      where: { sportId_apiGameId: { sportId, apiGameId } },
      update: {
        ...data,
      },
      create: {
        ...data,
      },
    })
    // creating bridge tables
    const awayTeamInGameData = { teamId: internalAwayTeamId, gameId }
    await prismaClient.teamInGame.upsert({
      where: { teamId_gameId: { ...awayTeamInGameData } },
      update: {
        ...awayTeamInGameData,
      },
      create: {
        ...awayTeamInGameData,
        notes: '',
      },
    })

    const homeTeamInGameData = { teamId: internalHomeTeamId, gameId }
    await prismaClient.teamInGame.upsert({
      where: { teamId_gameId: { ...homeTeamInGameData } },
      update: {
        ...homeTeamInGameData,
      },
      create: {
        ...homeTeamInGameData,
        notes: '',
      },
    })

    logger.debug(`${sport_name}:Game:Upserted: ${JSON.stringify(data)}`)
  } catch (error) {
    logger.error(`${sport_name}:Game:Error: ${error}`)
  }
}

export const processGameOddsMessage = async (value: KafkaMessageValue): Promise<void> => {
  const { sport_name, data } = value
  const { homeTeamName, awayTeamName, gameId } = data
  data.gameDate = new Date(data.gameDate)
  const gameDateTemp = new Date(data.gameDate)
  try {
    const gameDateHour = gameDateTemp.setMinutes(0, 0, 0)

    const isGameOddExist = await prismaClient.gameOdds.findFirst({
      where: {
        gameId,
        homeTeamName,
        awayTeamName,
        gameDate: {
          gte: new Date(gameDateHour),
          lt: new Date(gameDateHour + 60 * 60 * 1000),
        },
      },
    })
    if (isGameOddExist) {
      await prismaClient.gameOdds.updateMany({
        where: { gameId: data?.gameId, apiSourceId: data?.apiSourceId },
        data: {
          ...data,
        },
      })
      logger.debug(`${sport_name}:GameOdds:Updated: ${JSON.stringify(data)}`)
    } else {
      await prismaClient.gameOdds.create({
        data: {
          ...data,
        },
      })
      logger.debug(`${sport_name}:GameOdds:Created: ${JSON.stringify(data)}`)
    }
  } catch (error) {
    logger.error(`${sport_name}:GameOdds:Error: ${error}`)
  }
}

export const processGameStatsMessage = async (value: KafkaMessageValue): Promise<void> => {
  const { sport_name, data } = value
  const { apiGameId, sportId } = data

  try {
    await prismaClient.gamesStats.upsert({
      where: { apiGameId_sportId: { apiGameId, sportId } },
      update: {
        ...data,
      },
      create: {
        ...data,
      },
    })

    logger.debug(`${sport_name}:GameStats:Upserted: ${JSON.stringify(data)}`)
  } catch (error) {
    logger.error(`${sport_name}:GameStats:Error: ${error}`)
  }
}

export const processLeaguesMessage = async (value: KafkaMessageValue): Promise<void> => {
  const { sport_name, data } = value
  const { leagueName, sportId, internalSeasons } = data
  delete data.internalSeasons
  try {
    const { leagueId }: Prisma.Leagues = await prismaClient.leagues.upsert({
      where: { sportId_leagueName: { sportId, leagueName } },
      update: {
        ...data,
      },
      create: {
        ...data,
      },
    })

    if (sport_name === Sports.Soccer || sport_name === Sports.Football) {
      await Promise.all(
        internalSeasons.map(async (season: number) => {
          const seasonData = {
            leagueId,
            season,
          }
          await prismaClient.seasons.upsert({
            where: { leagueId_season: { ...seasonData } },
            update: {
              ...seasonData,
            },
            create: {
              ...seasonData,
              status: Status.Active,
            },
          })
        }),
      )
    }
    logger.debug(`${sport_name}:League:Upserted: ${JSON.stringify(data)}`)
  } catch (error) {
    logger.error(`${sport_name}:League:Error: ${error}`)
  }
}

export const processPlayersMessage = async (value: KafkaMessageValue): Promise<void> => {
  const { sport_name, data } = value
  const {
    apiPlayerId,
    sportId,
    internalSeasonId: seasonId,
    data: { jnumber, position },
  } = data

  let { internalTeamId: teamId } = data
  delete data.internalTeamId
  delete data.internalSeasonId
  delete data.data.jnumber
  delete data.data.position

  if (sport_name === Sports.MMA) {
    const { internalTeamData } = data
    const { apiTeamId, internalLeagueId: leagueId } = internalTeamData
    delete internalTeamData.internalLeagueId

    const { teamId: teamIdForMMA }: Prisma.Teams = await prismaClient.teams.upsert({
      where: { sportId_apiTeamId: { sportId, apiTeamId } },
      update: {
        ...(internalTeamData as Prisma.Teams),
      },
      create: {
        ...(internalTeamData as Prisma.Teams),
      },
    })
    teamId = teamIdForMMA

    // creating bridge table
    const teamInLeagueData = { teamId, leagueId }
    await prismaClient.teamInLeague.upsert({
      where: { teamId_leagueId: { ...teamInLeagueData } },
      update: {
        ...teamInLeagueData,
      },
      create: {
        ...teamInLeagueData,
      },
    })
  }

  delete data.internalTeamData

  try {
    const { playerId } = await prismaClient.players.upsert({
      where: { sportId_apiPlayerId: { sportId, apiPlayerId } },
      update: {
        ...data,
      },
      create: {
        ...data,
      },
    })

    //creating the bridge tables
    await prismaClient.playerInSport.upsert({
      where: { playerId_sportId: { playerId, sportId } },
      update: {
        playerId,
        sportId,
      },
      create: {
        playerId,
        sportId,
      },
    })

    const playerInTeamData = {
      playerId,
      teamId,
      seasonId,
      jnumber,
      position,
      notes: null,
    }
    await prismaClient.playerInTeam.upsert({
      where: { playerId_teamId_seasonId: { playerId, teamId, seasonId } },
      update: {
        ...playerInTeamData,
      },
      create: {
        ...playerInTeamData,
      },
    })

    logger.debug(`${sport_name}:Player:Upserted: ${JSON.stringify(data)}`)
  } catch (error) {
    logger.error(`${sport_name}:Player:Error: ${error}`)
  }
}

export const processPlayersStatsMessage = async (value: KafkaMessageValue): Promise<void> => {
  const { sport_name, data } = value
  const { apiGameId, apiPlayerId, sportId } = data

  try {
    await prismaClient.playersStats.upsert({
      where: { sportId_apiGameId_apiPlayerId: { sportId, apiGameId, apiPlayerId } },
      update: {
        ...data,
      },
      create: {
        ...data,
      },
    })

    logger.debug(`${sport_name}:PlayerStats:Upserted: ${JSON.stringify(data)}`)
  } catch (error) {
    logger.error(`${sport_name}:PlayerStats:Error: ${error}`)
  }
}

export const processSeasonsMessage = async (value: KafkaMessageValue): Promise<void> => {
  const { sport_name, data } = value
  const { leagueId, season } = data

  try {
    await prismaClient.seasons.upsert({
      where: { leagueId_season: { leagueId, season } },
      update: {
        ...data,
      },
      create: {
        ...data,
      },
    })

    logger.debug(`${sport_name}:Season:Upserted: ${JSON.stringify(data)}`)
  } catch (error) {
    logger.error(`${sport_name}:Season:Error: ${error}`)
  }
}

export const processTeamMessage = async (value: KafkaMessageValue): Promise<void> => {
  const { sport_name, data } = value
  const { apiTeamId, sportId, internalLeagueId: leagueId } = data
  delete data?.internalLeagueId
  try {
    const { teamId }: Prisma.Teams = await prismaClient.teams.upsert({
      where: { sportId_apiTeamId: { sportId, apiTeamId } },
      update: {
        ...(data as Prisma.Teams),
      },
      create: {
        ...(data as Prisma.Teams),
      },
    })

    // creating bridge table
    const teamInLeagueData = { teamId, leagueId }
    await prismaClient.teamInLeague.upsert({
      where: { teamId_leagueId: { ...teamInLeagueData } },
      update: {
        ...teamInLeagueData,
      },
      create: {
        ...teamInLeagueData,
      },
    })

    logger.debug(`${sport_name}:Team:Upserted: ${JSON.stringify(data)}`)
  } catch (error) {
    logger.error(`${sport_name}:Team:Error: ${error}`)
  }
}

export const processTeamStatsMessage = async (value: KafkaMessageValue): Promise<void> => {
  const { sport_name, data } = value
  const { apiGameId, apiTeamId, sportId } = data

  try {
    await prismaClient.teamsStats.upsert({
      where: { sportId_apiGameId_apiTeamId: { sportId, apiGameId, apiTeamId } },
      update: {
        ...data,
      },
      create: {
        ...data,
      },
    })

    logger.debug(`${sport_name}:TeamStats:Upserted: ${JSON.stringify(data)}`)
  } catch (error) {
    logger.error(`${sport_name}:TeamStats:Error: ${error}`)
  }
}

export const saveEventToDb = async (message: KafkaMessage): Promise<void> => {
  try {
    if (!(validateMessageValue(message) && validateHeaders(message.headers as IHeaders))) {
      throw new NonRetriableError(`Invalid data/headers in message`)
    }
    const value = message.value?.toString() as string
    const headers = message.headers as IKafkaMessageHeaders
    const attempt = headers.retryAttempt?.toString()
    const accId = message.key?.toString()
    if (!attempt) {
      await retryHandler(accId as string, RETRY.CHECK)
    }
    const messageVal = JSON.parse(value)
    logger.debug(`Kafka message value: ${JSON.stringify(messageVal)}`)
    logger.debug(`Kafka message table name: ${messageVal.table}`)
    // The following condition is added in order to restrict the data processing on QA or Prod for the sports which are under process of integration yet. The data for those will be received on the local first and once the integration is completed, the name will be added in the ist below. For example, at this moment Baseball and Basketball are integrated, so the messages related to those can be consumed on QA or Prod, but the integration of MMA needs to be finalised yet, so that should not be processed on QA / Prod.
    const integratedGames = [Sports.Baseball, Sports.Football, Sports.MMA, Sports.Soccer, Sports.Basketball]
    if (!integratedGames.includes(messageVal.sport_name)) {
      logger.debug(`Data received for non-integrated game: ${messageVal.sport_name}`)
      return
    }
    switch (messageVal.table) {
      case 'leagues':
        await processLeaguesMessage(messageVal)
        break
      case 'seasons':
        await processSeasonsMessage(messageVal)
        break
      case 'teams':
        await processTeamMessage(messageVal)
        break
      case 'players':
        await processPlayersMessage(messageVal)
        break
      case 'games':
        await processGameMessage(messageVal)
        break
      case 'game_stats':
        // this will be call in case of "basketball"
        await processGameStatsMessage(messageVal)
        break
      case 'player_stats':
        await processPlayersStatsMessage(messageVal)
        break
      case 'odds':
        await processGameOddsMessage(messageVal)
        break
      case 'bet_odds':
        await processBetOddsMessage(messageVal)
        break
      case 'team_stats':
        await processTeamStatsMessage(messageVal)
        break

      default:
    }
    if (attempt) {
      await retryHandler(accId as string, RETRY.DECREMENT)
    }
  } catch (error) {
    logger.error(error)
    if (error instanceof RetriableError) {
      await sendToRetryTopic(message, WORKERS.SPORTS)
    }
    //TEMP. COMMENTING THESE BECAUSE OF SO MANY ALERTS ON SLACK.
    // else if (error instanceof NonRetriableError) {
    //   await sendToDlqAndAlert(message, JSON.stringify(error), WORKERS.SPORTS)
    // } else {
    //   logger.info('Stopping sports worker')
    //   logger.error('Error: ', error)
    //   const alertMessage: IKafkaMessage = {
    //     key: message.key?.toString() || '',
    //     value: {
    //       eventName: '',
    //       data: {
    //         message: 'CRITICAL: Sports Worker Stopped',
    //         priority: AlertPriority.Critical,
    //         source: WORKERS.SPORTS,
    //         details: {
    //           error: JSON.stringify(error),
    //           headers: JSON.stringify(message.headers),
    //         },
    //       },
    //     },
    //   }
    //   await sendAlert(alertMessage)
    //   await worker.disconnect()
    // }
  }
}

const checkLogInfoAndSend = async (message: KafkaMessage): Promise<void> => {
  const logInfo = new Promise((resolve, reject) => {
    try {
      const headers = message.headers as IHeaders
      correlationIdMiddleware(headers, null, async () => {
        await saveEventToDb(message)
        resolve('resolved')
      })
    } catch (err) {
      reject(err)
    }
  })
  await logInfo
}

// start worker
export async function startWorker(): Promise<void> {
  try {
    const topicsToSubscribe = [
      TOPICS.SPORTS.GAME,
      TOPICS.SPORTS.TEAM,
      TOPICS.SPORTS.PLAYER,
      TOPICS.SPORTS.GAMESTATS,
      TOPICS.SPORTS.PLAYERSTATS,
      TOPICS.SPORTS.GAMEODDS,
      TOPICS.SPORTS.SEASON,
      TOPICS.SPORTS.LEAGUE,
      TOPICS.SPORTS.TEAMSTATS,
    ]
    await worker.connect()
    await worker.subscribe(topicsToSubscribe)
    logger.debug(`Consuming messages from broker in sports ${brokers} and topics ${topicsToSubscribe}`)
    await worker.startConsumer(checkLogInfoAndSend)
  } catch (error) {
    logger.error(error)
  }
}
