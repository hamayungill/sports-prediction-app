/* eslint-disable  @typescript-eslint/no-explicit-any */
import prismaClient, { Prisma } from '@duelnow/database'
import { JsonObject } from 'swagger-ui-express'

import { participantScore } from './utils/const'
const { PickemScoreMode, Status, TxnStatus } = Prisma
const { challenges, challengeResults, pickemChallengeLineups } = prismaClient

// calculate Pickem Points
const calculatePickemPoints = async (resultData: JsonObject): Promise<number[] | []> => {
  let outrightScore: number = 0
  let spreadScore: number = 0
  let differenceOfTwoTeamsTotal: number
  let tieBreakerDifference: number = 0
  let totalGamePoints: number = 0
  const challengeIds: number[] = []
  const pickemTransaction: any = []
  const participantScoreIds: number[] = []
  let updatePrticipantScore
  if (resultData.games.pickemChallengeLineups && resultData.games.pickemChallengeLineups.length > 0) {
    await resultData.games?.pickemChallengeLineups?.forEach(async (lineups: JsonObject) => {
      if (
        lineups.pickStatus === Status.Active &&
        (lineups.processingStatus === null || lineups.processingStatus === TxnStatus.Pending)
      ) {
        let selectedTeamTotal: number = 0
        let unSelectedTeamTotal: number = 0

        challengeIds.push(lineups.challengeId)
        if (resultData.games.teamsStats[0].teams.teamId === lineups.pickTeamId) {
          selectedTeamTotal = resultData.games.teamsStats[0].teamStats.statistics.total
          unSelectedTeamTotal = resultData.games.teamsStats[1].teamStats.statistics.total
        } else if (resultData.games.teamsStats[1].teams.teamId === lineups.pickTeamId) {
          selectedTeamTotal = resultData.games.teamsStats[1].teamStats.statistics.total
          unSelectedTeamTotal = resultData.games.teamsStats[0].teamStats.statistics.total
        }

        if (
          lineups.challenges.pickemScoreMode === null ||
          lineups.challenges.pickemScoreMode === PickemScoreMode.OutrightWinner
        ) {
          if (selectedTeamTotal > unSelectedTeamTotal) {
            outrightScore = 1
            participantScoreIds.push(lineups.id)
          } else {
            outrightScore = 0
          }
        } else if (lineups.challenges.pickemScoreMode === PickemScoreMode.WinnerBySpread) {
          differenceOfTwoTeamsTotal = Math.abs(
            resultData.games.teamsStats[0].teamStats.statistics.total -
              resultData.games.teamsStats[1].teamStats.statistics.total,
          )

          if (lineups.spreadPoints > 0) {
            if (selectedTeamTotal < unSelectedTeamTotal) {
              spreadScore = differenceOfTwoTeamsTotal < lineups.spreadPoints - 1 ? 1 : 0
            } else if (selectedTeamTotal > unSelectedTeamTotal) {
              spreadScore = 1
            }
          } else if (lineups.spreadPoints < 0) {
            if (selectedTeamTotal > unSelectedTeamTotal) {
              spreadScore = differenceOfTwoTeamsTotal > lineups.spreadPoints * -1 - 0.5 ? 1 : 0
            } else if (selectedTeamTotal < unSelectedTeamTotal) {
              spreadScore = 0
            }
          }

          if (spreadScore === 1) {
            participantScoreIds.push(lineups.id)
          }
        }

        totalGamePoints = selectedTeamTotal + unSelectedTeamTotal
        tieBreakerDifference = Math.abs(
          totalGamePoints -
            (lineups.challengeResults.participantStatP1 !== null
              ? Number(lineups.challengeResults.participantStatP1)
              : 0),
        )

        pickemTransaction.push(
          challengeResults.update({
            where: {
              challengeResultId: lineups.challengeResults.challengeResultId,
            },
            data: {
              totalScore:
                Number(lineups.challengeResults.totalScore) > 0
                  ? Number(lineups.challengeResults.totalScore) + outrightScore
                  : outrightScore,
              spreadPoints:
                Number(lineups.challengeResults.spreadPoints) > 0
                  ? Number(lineups.challengeResults.spreadPoints) + spreadScore
                  : spreadScore,
              differenceP1: tieBreakerDifference,
              pickemChallengeLineups: {
                update: {
                  where: {
                    id: lineups.id,
                  },
                  data: {
                    processingStatus: TxnStatus.Success,
                  },
                },
              },
            },
          }),
        )
        outrightScore = 0
        spreadScore = 0
      }
    })

    if (participantScoreIds.length > 0) {
      updatePrticipantScore = pickemChallengeLineups.updateMany({
        where: {
          id: {
            in: participantScoreIds,
          },
        },
        data: {
          participantScore,
        },
      })
      await prismaClient.$transaction([...pickemTransaction, updatePrticipantScore])
    }
  }
  return challengeIds
}

const calculateLeaderboard = async (challengeIds: number[]): Promise<JsonObject[]> => {
  const leaderboardTransaction: JsonObject[] = []
  const challengesData: JsonObject[] = await challenges.findMany({
    where: {
      challengeId: {
        in: challengeIds,
      },
    },
    select: {
      challengeId: true,
      pickemScoreMode: true,
      challengeResults: {
        select: {
          challengeResultId: true,
          challengeId: true,
          totalScore: true,
          spreadPoints: true,
          participantStatP1: true,
          participantPosition: true,
          differenceP1: true,
        },
      },
    },
  })
  if (challengesData.length > 0) {
    challengesData.forEach((challengeData: JsonObject) => {
      let previousScore = -1
      let previousDifference = -1
      let previousPosition = 0
      let position = 0
      let count = 0
      let currentScore = 0
      challengeData.challengeResults.sort((a: JsonObject, b: JsonObject) => {
        if (
          challengeData.pickemScoreMode === null ||
          challengeData.pickemScoreMode === PickemScoreMode.OutrightWinner
        ) {
          if (Number(a.totalScore) > Number(b.totalScore)) return -1
          if (Number(a.totalScore) < Number(b.totalScore)) return 1
        } else if (challengeData.pickemScoreMode === PickemScoreMode.WinnerBySpread) {
          if (Number(a.spreadPoints) > Number(b.spreadPoints)) return -1
          if (Number(a.spreadPoints) < Number(b.spreadPoints)) return 1
        }

        if (Number(a.differenceP1) < Number(b.differenceP1)) return -1
        if (Number(a.differenceP1) > Number(b.differenceP1)) return 1

        return 0
      })
      challengeData.challengeResults.forEach((item: JsonObject, index: number) => {
        if (
          challengeData.pickemScoreMode === null ||
          challengeData.pickemScoreMode === PickemScoreMode.OutrightWinner
        ) {
          currentScore = item.totalScore
        } else if (challengeData.pickemScoreMode === PickemScoreMode.WinnerBySpread) {
          currentScore = item.spreadPoints
        }
        if (
          Number(previousDifference) === Number(item.differenceP1) &&
          Number(previousScore) === Number(currentScore)
        ) {
          position = previousPosition
          count += 1
        } else {
          position = count > 0 ? index + 1 - count : index + 1
        }
        previousPosition = position
        previousDifference = item.differenceP1
        previousScore = currentScore
        leaderboardTransaction.push(
          challengeResults.update({
            where: {
              challengeResultId: item.challengeResultId,
            },
            data: {
              participantPosition: currentScore > 0 ? position : -1,
            },
          }),
        )
      })
      previousDifference = -1
      previousPosition = 1
      position = 0
      count = 0
      currentScore = 0
    })
  }
  return leaderboardTransaction
}

export { calculateLeaderboard, calculatePickemPoints }
