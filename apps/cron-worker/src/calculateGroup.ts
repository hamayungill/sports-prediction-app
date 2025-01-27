/* eslint-disable  @typescript-eslint/no-explicit-any */
import prismaClient, { Prisma } from '@duelnow/database'
import { EVENTS } from '@duelnow/utils'
import { JsonObject } from 'swagger-ui-express'

import { insertContractDataFeed } from './cancelChallengesToCdf'
import { logger, sendProcessingAlert } from './utils'
import { CorrectScoreAtt, GroupLogicCode, ResultValues, Subgroup } from './utils/const'
import { CancelReasonCode } from '../../../packages/utils/src/consts'

const { ChallengeStatus, Outcome, ParticipantRole } = Prisma
const { challengeResults } = prismaClient

const calculateResultsByLogicCode = async (
  challengeData: JsonObject,
  resultData: JsonObject,
  creatorData: JsonObject,
  gameTransaction: JsonObject[],
  failedChallengeIds: number[],
): Promise<void> => {
  let finalOutcome: Prisma.Outcome | null = null
  if (challengeData?.challengeResults[0]?.groups?.logicCode !== null) {
    // Calculate Home Away Results
    // Calculate winning team
    logger.info('logicCode', challengeData?.challengeResults[0]?.groups?.logicCode)
    if (challengeData?.challengeResults[0]?.groups?.logicCode === GroupLogicCode.WinningTeam) {
      let selectedTeamTotal: number | null | undefined
      let unSelectedTeamTotal: number | null | undefined

      if (resultData.games.teamsStats[0].teams.teamId === challengeData.teamId) {
        selectedTeamTotal = resultData.games.teamsStats[0].teamStats?.statistics[creatorData.statAttribute]
        unSelectedTeamTotal = resultData.games.teamsStats[1].teamStats?.statistics[creatorData.statAttribute]
      } else if (resultData.games.teamsStats[1].teams.teamId === challengeData.teamId) {
        selectedTeamTotal = resultData.games.teamsStats[1].teamStats?.statistics[creatorData.statAttribute]
        unSelectedTeamTotal = resultData.games.teamsStats[0].teamStats?.statistics[creatorData.statAttribute]
      }

      if (selectedTeamTotal == null || unSelectedTeamTotal == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, creatorData.statAttribute, {
          teamStats: resultData.games.teamsStats,
        })
      } else {
        if (selectedTeamTotal === unSelectedTeamTotal) {
          if (challengeData.status !== ChallengeStatus.Cancelled) {
            finalOutcome = Outcome.CancelledOrDraw
            await insertContractDataFeed([challengeData], CancelReasonCode.Draw)
          }
        } else if (selectedTeamTotal > unSelectedTeamTotal) {
          finalOutcome = Outcome.Win
        } else if (selectedTeamTotal < unSelectedTeamTotal) {
          finalOutcome = Outcome.Lose
        }
      }
    }

    // Calculate winning team spread
    if (challengeData?.challengeResults[0]?.groups?.logicCode === GroupLogicCode.WinningTeamSpread) {
      let selectedTeamTotal: number | null | undefined
      let unSelectedTeamTotal: number | null | undefined
      let differenceOfTwoTeamsTotal: number

      if (resultData.games.teamsStats[0].teams.teamId === challengeData.teamId) {
        selectedTeamTotal = resultData.games.teamsStats[0].teamStats?.statistics[creatorData.statAttribute]
        unSelectedTeamTotal = resultData.games.teamsStats[1].teamStats?.statistics[creatorData.statAttribute]
      } else if (resultData.games.teamsStats[1].teams.teamId === challengeData.teamId) {
        selectedTeamTotal = resultData.games.teamsStats[1].teamStats?.statistics[creatorData.statAttribute]
        unSelectedTeamTotal = resultData.games.teamsStats[0].teamStats?.statistics[creatorData.statAttribute]
      }

      if (selectedTeamTotal == null || unSelectedTeamTotal == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, creatorData.statAttribute, {
          teamStats: resultData.games.teamsStats,
        })
      } else {
        differenceOfTwoTeamsTotal = Math.abs(selectedTeamTotal - unSelectedTeamTotal)

        if (differenceOfTwoTeamsTotal === Math.abs(Number(creatorData.participantStatP1))) {
          if (challengeData.status !== ChallengeStatus.Cancelled) {
            finalOutcome = Outcome.CancelledOrDraw
            await insertContractDataFeed([challengeData], CancelReasonCode.Draw)
          }
        } else if (Number(creatorData.participantStatP1) > 0) {
          if (selectedTeamTotal < unSelectedTeamTotal) {
            finalOutcome =
              differenceOfTwoTeamsTotal <= Math.round(Number(creatorData.participantStatP1)) - 1
                ? Outcome.Win
                : Outcome.Lose
          } else if (selectedTeamTotal > unSelectedTeamTotal) {
            finalOutcome = Outcome.Win
          }
        } else if (Number(creatorData.participantStatP1) < 0) {
          if (selectedTeamTotal > unSelectedTeamTotal) {
            finalOutcome =
              differenceOfTwoTeamsTotal > Math.abs(Math.round(Number(creatorData.participantStatP1)))
                ? Outcome.Win
                : Outcome.Lose
          } else if (selectedTeamTotal < unSelectedTeamTotal) {
            finalOutcome = Outcome.Lose
          }
        }
      }
    }

    // calculate 1st 60 seconds results
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.MmaEndsInSeconds) {
      let selectedGameRound: number | null | undefined
      let selectedGameMinute: number | null | undefined = 0

      if (resultData.games.gameId === challengeData.gameId) {
        selectedGameRound = resultData.games.gamesStats.gameStats?.statistics?.round
        selectedGameMinute = parseFloat(resultData.games.gamesStats.gameStats?.statistics?.minute?.replace(':', '.'))
      }

      if (selectedGameRound == null || isNaN(selectedGameMinute)) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, 'round, minute', {
          gameStats: resultData.games.gamesStats,
        })
      } else {
        if (creatorData?.subgroups?.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
          finalOutcome = Number(selectedGameRound) === 1 && selectedGameMinute <= 1 ? Outcome.Win : Outcome.Lose
        } else if (creatorData?.subgroups?.subgroupApiTitle.toLowerCase() === Subgroup.No) {
          finalOutcome =
            (Number(selectedGameRound) === 1 && selectedGameMinute > 1) || Number(selectedGameRound) > 1
              ? Outcome.Win
              : Outcome.Lose
        }
      }
    }

    // Calculate Fight To Go the Distance
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.MmaToGoDistance) {
      let selectedGameRound: number | null | undefined
      let isMain: boolean | null | undefined
      let wonType: string | null | undefined

      if (resultData.games.gameId === challengeData.gameId) {
        selectedGameRound = resultData.games.gamesStats.gameStats?.statistics?.round
        wonType = resultData.games.gamesStats.gameStats?.statistics?.won_type?.toLowerCase()
        isMain = resultData.games.gamesStats.gameStats?.stage?.toLowerCase() === ResultValues.Main ? true : false
      }

      if (selectedGameRound == null || wonType == null || resultData.games.gamesStats.gameStats?.stage == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, 'round, won_type, stage', {
          gameStats: resultData.games.gamesStats,
        })
      } else {
        if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
          if (isMain) {
            finalOutcome = selectedGameRound === 5 && wonType === ResultValues.Points ? Outcome.Win : Outcome.Lose
          } else {
            finalOutcome = selectedGameRound === 3 && wonType === ResultValues.Points ? Outcome.Win : Outcome.Lose
          }
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
          if (isMain) {
            finalOutcome = selectedGameRound <= 5 && wonType !== ResultValues.Points ? Outcome.Win : Outcome.Lose
          } else {
            finalOutcome = selectedGameRound <= 3 && wonType !== ResultValues.Points ? Outcome.Win : Outcome.Lose
          }
        }
      }
    }

    // Calculate Fight Ends in Round
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.MmaEndsInRound) {
      let selectedGameResult: number | null | undefined

      if (resultData.games.gameId === challengeData.gameId) {
        selectedGameResult = resultData.games.gamesStats.gameStats?.statistics?.round
      }

      if (selectedGameResult == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, 'round', {
          gameStats: resultData.games.gamesStats,
        })
      } else {
        finalOutcome = selectedGameResult === Number(creatorData.participantStatP1) ? Outcome.Win : Outcome.Lose
      }
    }

    // Calculate Win to Nil
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.WinToNil) {
      let selectedTeamResult: boolean | null | undefined
      let selectedTeamGoals: number | null | undefined
      let unSelectedTeamGoals: number | null | undefined

      if (resultData.games.teamsStats[0].teams.teamId === challengeData.teamId) {
        selectedTeamResult = resultData.games.teamsStats[0].teamStats?.team?.winner
        selectedTeamGoals = resultData.games.teamsStats[0].teamStats?.statistics[creatorData.statAttribute]
        unSelectedTeamGoals = resultData.games.teamsStats[1].teamStats?.statistics[creatorData.statAttribute]
      } else if (resultData.games.teamsStats[1].teams.teamId === challengeData.teamId) {
        selectedTeamResult = resultData.games.teamsStats[1].teamStats?.team?.winner
        selectedTeamGoals = resultData.games.teamsStats[1].teamStats?.statistics[creatorData.statAttribute]
        unSelectedTeamGoals = resultData.games.teamsStats[0].teamStats?.statistics[creatorData.statAttribute]
      }

      if (selectedTeamResult == null || selectedTeamGoals == null || unSelectedTeamGoals == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, `winner, ${creatorData.statAttribute}`, {
          teamStats: resultData.games.teamsStats,
        })
      } else {
        if (
          (selectedTeamGoals === null || selectedTeamGoals === 0) &&
          (unSelectedTeamGoals === null || unSelectedTeamGoals === 0)
        ) {
          if (challengeData.status !== ChallengeStatus.Cancelled) {
            finalOutcome = Outcome.CancelledOrDraw
            await insertContractDataFeed([challengeData], CancelReasonCode.Draw)
          }
        } else {
          finalOutcome = selectedTeamResult === true && unSelectedTeamGoals === 0 ? Outcome.Win : Outcome.Lose
        }
      }
    }

    // Calculate Correct Score - First Half / Second Half
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.CorrectScore) {
      let initiatorHomeValue: number = 0
      let initiatorAwayValue: number = 0
      let initializerHomeValue: number = 0
      let initializerAwayValue: number = 0
      let homeResult: number | null | undefined
      let awayResult: number | null | undefined
      let homeAtt: string = ''
      let awayAtt: string = ''

      challengeData.challengeResults.forEach((data: JsonObject) => {
        if (data.challengeParticipations[0].participantRole === ParticipantRole.Initiator) {
          initiatorHomeValue = Number(data.participantStatP1)
          initiatorAwayValue = Number(data.participantStatP2)
        }

        if (data.challengeParticipations[0].participantRole === ParticipantRole.Initializer) {
          initializerHomeValue = Number(data.participantStatP1)
          initializerAwayValue = Number(data.participantStatP2)
        }
      })

      if (resultData.games.gameId === challengeData.gameId) {
        if (creatorData.statAttribute === CorrectScoreAtt.halftime) {
          homeAtt = CorrectScoreAtt.halftime_home
          awayAtt = CorrectScoreAtt.halftime_away
        } else if (creatorData.statAttribute === CorrectScoreAtt.fulltime) {
          homeAtt = CorrectScoreAtt.fulltime_home
          awayAtt = CorrectScoreAtt.fulltime_away
        }

        homeResult = resultData.games.gamesStats.gameStats?.statistics[homeAtt]
        awayResult = resultData.games.gamesStats.gameStats?.statistics[awayAtt]

        if (homeResult == null || awayResult == null) {
          failedChallengeIds.push(challengeData.challengeId)
          sendAlert(challengeData.challengeId, `${homeAtt}, ${awayAtt}`, {
            gameStats: resultData.games.gamesStats,
          })
        } else {
          if (homeResult === initiatorHomeValue && awayResult === initiatorAwayValue) {
            finalOutcome = Outcome.Win
          } else if (homeResult === initializerHomeValue && awayResult === initializerAwayValue) {
            finalOutcome = Outcome.Lose
          } else if (challengeData.status !== ChallengeStatus.Cancelled) {
            finalOutcome = Outcome.CancelledOrDraw
            await insertContractDataFeed([challengeData], CancelReasonCode.Draw)
          }
        }
      }
    }

    // Calculate Over Under Games Results
    // calculate over under for total
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.OverUnderTotalScore) {
      let selectedGameTotal: number | null | undefined

      if (resultData.games.gameId === challengeData.gameId) {
        selectedGameTotal =
          Number(resultData.games.teamsStats[0].teamStats?.statistics[creatorData.statAttribute]) +
          Number(resultData.games.teamsStats[1].teamStats?.statistics[creatorData.statAttribute])
      }

      if (selectedGameTotal == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, `${creatorData.statAttribute}`, {
          gameStats: resultData.games.teamsStats,
        })
      } else {
        if (selectedGameTotal === Number(creatorData.participantStatP1)) {
          if (challengeData.status !== ChallengeStatus.Cancelled) {
            finalOutcome = Outcome.CancelledOrDraw
            await insertContractDataFeed([challengeData], CancelReasonCode.Draw)
          }
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Over) {
          finalOutcome = selectedGameTotal > Number(creatorData.participantStatP1) ? Outcome.Win : Outcome.Lose
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Under) {
          finalOutcome = selectedGameTotal < Number(creatorData.participantStatP1) ? Outcome.Win : Outcome.Lose
        }
      }
    }

    // Calculate Rounds By Duration
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.MmaRoundsByDuration) {
      let selectedGameRound: number | null | undefined
      let selectedGameMinute: number = 0

      if (resultData.games.gameId === challengeData.gameId) {
        selectedGameRound = resultData.games.gamesStats.gameStats?.statistics?.round
        selectedGameMinute = parseFloat(resultData.games.gamesStats.gameStats?.statistics?.minute?.replace(':', '.'))
      }

      if (selectedGameRound == null || isNaN(selectedGameMinute)) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, 'round, minute', {
          gameStats: resultData.games.gamesStats,
        })
      } else {
        if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.OverOneFive) {
          finalOutcome =
            (selectedGameRound === 2 && selectedGameMinute > 2.3) || selectedGameRound > 2 ? Outcome.Win : Outcome.Lose
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.UnderOneFive) {
          finalOutcome =
            (selectedGameRound === 2 && selectedGameMinute <= 2.29) || selectedGameRound < 2
              ? Outcome.Win
              : Outcome.Lose
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.OverTwoFive) {
          finalOutcome =
            (selectedGameRound === 3 && selectedGameMinute > 2.3) || selectedGameRound > 3 ? Outcome.Win : Outcome.Lose
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.UnderTwoFive) {
          finalOutcome =
            (selectedGameRound === 3 && selectedGameMinute <= 2.29) || selectedGameRound < 3
              ? Outcome.Win
              : Outcome.Lose
        }
      }
    }

    // Calculate Call It Games Results
    // calculate Game Red Cards
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.GameRedCards) {
      let selectedGameValue: number = 0
      let teamAValue: number = 0
      let teamBValue: number = 0
      if (resultData.games.gameId === challengeData.gameId) {
        teamAValue = resultData.games.teamsStats[0].teamStats?.statistics[creatorData.statAttribute] || 0
        teamBValue = resultData.games.teamsStats[1].teamStats?.statistics[creatorData.statAttribute] || 0
        selectedGameValue = teamAValue + teamBValue
      }

      if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
        finalOutcome = selectedGameValue > 0 ? Outcome.Win : Outcome.Lose
      } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
        finalOutcome = selectedGameValue === 0 ? Outcome.Win : Outcome.Lose
      }
    }

    // calculate overtime
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.GameOvertime) {
      let selectedGameValue: boolean | null | undefined
      if (resultData.games.gameId === challengeData.gameId) {
        selectedGameValue = resultData.games.gamesStats.gameStats?.statistics?.overtime
      }

      if (selectedGameValue == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, `overtime`, {
          gameStats: resultData.games.gamesStats,
        })
      } else {
        if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
          finalOutcome = selectedGameValue === true ? Outcome.Win : Outcome.Lose
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
          finalOutcome = selectedGameValue === false ? Outcome.Win : Outcome.Lose
        }
      }
    }

    // Highest Scoring Half
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.GameHighestScoringHalf) {
      let selectedSideValue: number = 0
      let unselectedSideValue: number = 0
      let altStatAttribute: string = ''
      if (resultData.games.gameId === challengeData.gameId) {
        altStatAttribute =
          creatorData.statAttribute === 'half_1' ? 'half_2' : creatorData.statAttribute === 'half_2' ? 'half_1' : ''
        selectedSideValue =
          (resultData.games.teamsStats[0].teamStats.statistics[creatorData.statAttribute] || 0) +
          (resultData.games.teamsStats[1].teamStats.statistics[creatorData.statAttribute] || 0)
        unselectedSideValue =
          (resultData.games.teamsStats[0].teamStats.statistics[altStatAttribute] || 0) +
          (resultData.games.teamsStats[1].teamStats.statistics[altStatAttribute] || 0)
      }

      if (selectedSideValue !== unselectedSideValue) {
        if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
          finalOutcome = selectedSideValue > unselectedSideValue ? Outcome.Win : Outcome.Lose
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
          finalOutcome = selectedSideValue < unselectedSideValue ? Outcome.Win : Outcome.Lose
        }
      } else if (selectedSideValue === unselectedSideValue && challengeData.status !== ChallengeStatus.Cancelled) {
        finalOutcome = Outcome.CancelledOrDraw
        await insertContractDataFeed([challengeData], CancelReasonCode.Draw)
      }
    }

    // Highest Scoring Quarter
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.GameHighestScoringQuarter) {
      let selectedSideValue: number = 0
      let unselectedSideAValue: number = 0
      let unselectedSideBValue: number = 0
      let unselectedSideCValue: number = 0
      let altStatAttributeA: string
      let altStatAttributeB: string
      let altStatAttributeC: string
      switch (creatorData.statAttribute) {
        case 'quarter_1':
          altStatAttributeA = 'quarter_2'
          altStatAttributeB = 'quarter_3'
          altStatAttributeC = 'quarter_4'
          break
        case 'quarter_2':
          altStatAttributeA = 'quarter_1'
          altStatAttributeB = 'quarter_3'
          altStatAttributeC = 'quarter_4'
          break
        case 'quarter_3':
          altStatAttributeA = 'quarter_1'
          altStatAttributeB = 'quarter_2'
          altStatAttributeC = 'quarter_4'
          break
        case 'quarter_4':
          altStatAttributeA = 'quarter_1'
          altStatAttributeB = 'quarter_2'
          altStatAttributeC = 'quarter_3'
          break
        default:
          altStatAttributeA = ''
          altStatAttributeB = ''
          altStatAttributeC = ''
      }
      if (resultData.games.gameId === challengeData.gameId) {
        selectedSideValue =
          (resultData.games.teamsStats[0].teamStats.statistics[creatorData.statAttribute] || 0) +
          (resultData.games.teamsStats[1].teamStats.statistics[creatorData.statAttribute] || 0)
        unselectedSideAValue =
          (resultData.games.teamsStats[0].teamStats.statistics[altStatAttributeA] || 0) +
          (resultData.games.teamsStats[1].teamStats.statistics[altStatAttributeA] || 0)
        unselectedSideBValue =
          (resultData.games.teamsStats[0].teamStats.statistics[altStatAttributeB] || 0) +
          (resultData.games.teamsStats[1].teamStats.statistics[altStatAttributeB] || 0)
        unselectedSideCValue =
          (resultData.games.teamsStats[0].teamStats.statistics[altStatAttributeC] || 0) +
          (resultData.games.teamsStats[1].teamStats.statistics[altStatAttributeC] || 0)
      }

      if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
        if (selectedSideValue < unselectedSideAValue) {
          finalOutcome = Outcome.Lose
        } else if (selectedSideValue < unselectedSideBValue) {
          finalOutcome = Outcome.Lose
        } else if (selectedSideValue < unselectedSideCValue) {
          finalOutcome = Outcome.Lose
        } else {
          finalOutcome = Outcome.Win
        }
      } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
        if (selectedSideValue > unselectedSideAValue) {
          finalOutcome = Outcome.Lose
        } else if (selectedSideValue > unselectedSideBValue) {
          finalOutcome = Outcome.Lose
        } else if (selectedSideValue > unselectedSideCValue) {
          finalOutcome = Outcome.Lose
        } else {
          finalOutcome = Outcome.Win
        }
      }
    }

    // Calculate Over Under Teams Results
    // calculate over under for fouls, hits, steals
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.OverUnderTeam) {
      let selectedTeamValue: number | null | undefined
      if (resultData.games.teamsStats[0].teams.teamId === challengeData.teamId) {
        selectedTeamValue = resultData.games.teamsStats[0].teamStats?.statistics[creatorData.statAttribute]
      } else if (resultData.games.teamsStats[1].teams.teamId === challengeData.teamId) {
        selectedTeamValue = resultData.games.teamsStats[1].teamStats?.statistics[creatorData.statAttribute]
      }
      if (selectedTeamValue == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, `${creatorData.statAttribute}`, {
          teamsStats: resultData.games.teamsStats,
        })
      } else {
        if (selectedTeamValue == Number(creatorData.participantStatP1)) {
          if (challengeData.status !== ChallengeStatus.Cancelled) {
            finalOutcome = Outcome.CancelledOrDraw
            await insertContractDataFeed([challengeData], CancelReasonCode.Draw)
          }
        } else if (creatorData?.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Over) {
          finalOutcome = selectedTeamValue > Number(creatorData.participantStatP1) ? Outcome.Win : Outcome.Lose
        } else if (creatorData?.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Under) {
          finalOutcome = selectedTeamValue < Number(creatorData.participantStatP1) ? Outcome.Win : Outcome.Lose
        }
      }
    }

    // Calculate Call It Teams Results
    // calculate Home Total Goals Even
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.HomeOddEven) {
      let selectedTeamValue: number | null | undefined
      if (resultData.games.teamsStats[0].teams.teamId === challengeData.teamId) {
        selectedTeamValue = resultData.games.teamsStats[0].teamStats?.statistics[creatorData.statAttribute]
      } else if (resultData.games.teamsStats[1].teams.teamId === challengeData.teamId) {
        selectedTeamValue = resultData.games.teamsStats[1].teamStats?.statistics[creatorData.statAttribute]
      }

      if (selectedTeamValue == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, `${creatorData.statAttribute}`, {
          teamsStats: resultData.games.teamsStats,
        })
      } else {
        if (selectedTeamValue == 0) {
          if (challengeData.status !== ChallengeStatus.Cancelled) {
            finalOutcome = Outcome.CancelledOrDraw
            await insertContractDataFeed([challengeData], CancelReasonCode.Draw)
          }
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
          finalOutcome = selectedTeamValue % 2 === 0 ? Outcome.Win : Outcome.Lose
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
          finalOutcome = selectedTeamValue % 2 !== 0 ? Outcome.Win : Outcome.Lose
        }
      }
    }

    // First Team to Score
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.FirstTeamToScore) {
      let firstGoal =
        resultData.games.gamesStats.gameStats?.statistics?.goal_time !== null
          ? resultData.games.gamesStats.gameStats?.statistics?.goal_time[0]
          : null

      if (firstGoal && firstGoal.quarter && firstGoal.time_elapsed) {
        // eslint-disable-next-line no-unsafe-optional-chaining
        for (const goalTime of resultData.games.gamesStats?.gameStats?.statistics?.goal_time) {
          if (
            goalTime.quarter < firstGoal.quarter ||
            (goalTime.quarter === firstGoal.quarter && goalTime.time_elapsed < firstGoal.time_elapsed)
          ) {
            firstGoal = goalTime
          }
        }

        if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
          finalOutcome = challengeData.teams.apiTeamId == firstGoal.api_team_id ? Outcome.Win : Outcome.Lose
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
          finalOutcome = challengeData.teams.apiTeamId != firstGoal.api_team_id ? Outcome.Win : Outcome.Lose
        }
      } else {
        if (challengeData.status !== ChallengeStatus.Cancelled) {
          finalOutcome = Outcome.CancelledOrDraw
          await insertContractDataFeed([challengeData], CancelReasonCode.Draw)
        }
      }
    }

    // Calculate Over Under Players Results
    // calculate over under for points
    if (challengeData?.challengeResults[0]?.groups?.logicCode === GroupLogicCode.OverUnderPlayer) {
      let selectedPlayerValue: number | null | undefined
      let alertplayerStats
      for (const playerData of resultData.games.playersStats) {
        if (playerData.players.playerId === challengeData.playerId) {
          selectedPlayerValue = playerData.playerStats?.statistics[creatorData.statAttribute]
          alertplayerStats = playerData.playerStats
        }
      }

      if (selectedPlayerValue == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, `${creatorData.statAttribute}`, {
          playerStats: alertplayerStats,
        })
      } else {
        if (selectedPlayerValue == Number(creatorData.participantStatP1)) {
          if (challengeData.status !== ChallengeStatus.Cancelled) {
            finalOutcome = Outcome.CancelledOrDraw
            await insertContractDataFeed([challengeData], CancelReasonCode.Draw)
          }
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Over) {
          finalOutcome = selectedPlayerValue > Number(creatorData.participantStatP1) ? Outcome.Win : Outcome.Lose
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Under) {
          finalOutcome = selectedPlayerValue < Number(creatorData.participantStatP1) ? Outcome.Win : Outcome.Lose
        }
      }
    }

    // Calculate Home Away Players Results
    // calculate win by KO TKO, DQ, SUB
    if (challengeData?.challengeResults[0]?.groups?.logicCode === GroupLogicCode.WinByKoTkoDqSubPlayer) {
      const selectedApiPlayerId: string | null | undefined = challengeData?.Players?.apiPlayerId
      const selectedGameResult: string | null | undefined =
        resultData.games.gamesStats.gameStats?.statistics[creatorData.statAttribute]

      if (selectedGameResult == null || selectedApiPlayerId == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, `${creatorData.statAttribute}`, {
          gamesStats: resultData.games.gamesStats,
        })
      } else {
        if (
          selectedGameResult.toLowerCase() === ResultValues.KO ||
          selectedGameResult.toLowerCase() === ResultValues.TKO ||
          selectedGameResult.toLowerCase() === ResultValues.DQ ||
          selectedGameResult.toLowerCase() === ResultValues.SUB
        ) {
          if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
            if (
              (resultData.games.gamesStats.gameStats.teams.home.id === Number(selectedApiPlayerId) &&
                resultData.games.gamesStats.gameStats.teams.home.winner === true) ||
              (resultData.games.gamesStats.gameStats.teams.away.id === Number(selectedApiPlayerId) &&
                resultData.games.gamesStats.gameStats.teams.away.winner === true)
            ) {
              finalOutcome = Outcome.Win
            } else {
              finalOutcome = Outcome.Lose
            }
          } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
            if (
              (resultData.games.gamesStats.gameStats.teams.home.id === Number(selectedApiPlayerId) &&
                resultData.games.gamesStats.gameStats.teams.home.winner === false) ||
              (resultData.games.gamesStats.gameStats.teams.away.id === Number(selectedApiPlayerId) &&
                resultData.games.gamesStats.gameStats.teams.away.winner === false)
            ) {
              finalOutcome = Outcome.Win
            } else {
              finalOutcome = Outcome.Lose
            }
          }
        }
      }
    }

    // Calculate Winning Fighter
    if (challengeData?.challengeResults[0]?.groups?.logicCode === GroupLogicCode.WinningFighter) {
      const selectedApiPlayerId: string | null | undefined = challengeData?.Players?.apiPlayerId
      const homeId = resultData.games.gamesStats.gameStats?.teams?.home?.id
      const awayId = resultData.games.gamesStats.gameStats?.teams?.away?.id
      const homeWinner = resultData.games.gamesStats.gameStats?.teams?.home?.winner
      const awayWinner = resultData.games.gamesStats.gameStats?.teams?.away?.winner

      if (homeId == null || awayId == null || homeWinner == null || awayWinner == null || selectedApiPlayerId == null) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, `winner`, {
          gamesStats: resultData.games.gamesStats,
        })
      } else {
        if (
          (homeId === Number(selectedApiPlayerId) && homeWinner === true) ||
          (awayId === Number(selectedApiPlayerId) && awayWinner === true)
        ) {
          finalOutcome = Outcome.Win
        } else {
          finalOutcome = Outcome.Lose
        }
      }
    }

    // Calculate Call It Players Results
    // calculate Player Red Cards
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.PlayerRedCards) {
      let selectedPlayerValue: number = 0
      for (const playerData of resultData.games.playersStats) {
        if (playerData.players.playerId === challengeData.playerId) {
          selectedPlayerValue = playerData.playerStats?.statistics[creatorData.statAttribute] || 0
        }
      }

      if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
        finalOutcome = selectedPlayerValue > 0 ? Outcome.Win : Outcome.Lose
      } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
        finalOutcome = selectedPlayerValue === 0 ? Outcome.Win : Outcome.Lose
      }
    }

    // calculate First Player to Score
    if (challengeData?.challengeResults[0]?.groups?.logicCode === GroupLogicCode.FirstPlayerToScore) {
      let gameResultData = null

      if (
        resultData.games.gameId === challengeData.gameId &&
        resultData.games.gamesStats.gameStats.statistics?.goal_time !== null
      ) {
        gameResultData = await resultData.games.gamesStats.gameStats.statistics?.goal_time?.sort(
          (a: JsonObject, b: JsonObject) => a.time_elapsed - b.time_elapsed,
        )
      }

      if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
        finalOutcome =
          gameResultData && gameResultData[0].api_player_id == challengeData.Players.apiPlayerId
            ? Outcome.Win
            : Outcome.Lose
      } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
        finalOutcome =
          gameResultData === null || gameResultData[0].api_player_id != challengeData.Players.apiPlayerId
            ? Outcome.Win
            : Outcome.Lose
      }
    }

    // Anytime Goal Scorer
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.AnytimeGoalScorer) {
      let goalScored: boolean | null | undefined = false
      const goalTimes = resultData.games.gamesStats?.gameStats?.statistics?.goal_time

      if (goalTimes == null || goalTimes.length == 0) {
        failedChallengeIds.push(challengeData.challengeId)
        sendAlert(challengeData.challengeId, `goal_time`, {
          gamesStats: resultData.games.gamesStats,
        })
      } else {
        // eslint-disable-next-line no-unsafe-optional-chaining
        for (const goalTime of goalTimes) {
          if (
            goalTime.api_team_id == challengeData.teams.apiTeamId &&
            goalTime.api_player_id == challengeData.Players.apiPlayerId
          ) {
            goalScored = true
          }
        }

        if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
          finalOutcome = goalScored === true ? Outcome.Win : Outcome.Lose
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
          finalOutcome = goalScored === false ? Outcome.Win : Outcome.Lose
        }
      }
    }

    // First NFL Player to Score
    if (challengeData.challengeResults[0]?.groups?.logicCode === GroupLogicCode.NflFirstPlayerToScore) {
      let firstGoal =
        resultData.games.gamesStats.gameStats?.statistics?.goal_time !== null
          ? resultData.games.gamesStats.gameStats?.statistics?.goal_time[0]
          : null

      if (firstGoal && firstGoal.quarter && firstGoal.time_elapsed) {
        // eslint-disable-next-line no-unsafe-optional-chaining
        for (const goalTime of resultData.games.gamesStats?.gameStats?.statistics?.goal_time) {
          if (
            goalTime.quarter < firstGoal.quarter ||
            (goalTime.quarter === firstGoal.quarter && goalTime.time_elapsed < firstGoal.time_elapsed)
          ) {
            firstGoal = goalTime
          }
        }

        if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.Yes) {
          finalOutcome = challengeData.Players.apiPlayerId == firstGoal.api_player_id ? Outcome.Win : Outcome.Lose
        } else if (creatorData.subgroups.subgroupApiTitle.toLowerCase() === Subgroup.No) {
          finalOutcome = challengeData.Players.apiPlayerId != firstGoal.api_player_id ? Outcome.Win : Outcome.Lose
        }
      } else {
        if (challengeData.status !== ChallengeStatus.Cancelled) {
          finalOutcome = Outcome.CancelledOrDraw
          await insertContractDataFeed([challengeData], CancelReasonCode.Draw)
        }
      }
    }

    gameTransaction.push(
      challengeResults.updateMany({
        where: {
          challengeId: challengeData.challengeId,
          finalOutcome: null,
        },
        data: {
          finalOutcome,
        },
      }),
    )
  }
}

const sendAlert = async (ChallengeId: number, statAttribute: string, messageData: JsonObject): Promise<void> => {
  const message = `ChallengeId ${ChallengeId} could not be resolved as ${statAttribute} is null or missing`
  await sendProcessingAlert(message, EVENTS.ALERT.PREDICTION_TO_RESULT_CALCULATED, messageData)
}

export { calculateResultsByLogicCode }
