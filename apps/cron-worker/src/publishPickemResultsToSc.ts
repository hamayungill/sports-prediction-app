import prismaClient, { Prisma } from '@duelnow/database'
import { correlationIdMiddleware } from '@duelnow/logger'
import { CancelReasonCode, CancelType, EVENTS, delay } from '@duelnow/utils'
import { cancelChallenge, resolveGroupChallenge } from '@duelnow/web3'
import { JsonObject } from 'swagger-ui-express'

import { logger, sendEventToWorker, sendProcessingAlert, updateCanceledWinLoss } from './utils'
import { ChallengeFundsMoved } from './utils/types'

const { CategoryDepth, CdfEvent, ChallengeMode, ChallengeParticipationStatus, ChallengeStatus, Outcome, TxnStatus } =
  Prisma
const { challengeParticipations, challengeResults, challenges, contractDataFeed } = prismaClient

// Publish Pickem Results To Sc
const publishPickemResultsToSc = async (): Promise<void> => {
  try {
    logger.info('Publish pickem results to SC got triggered.')
    const publishPickemResultsData: JsonObject | null = await contractDataFeed.findFirst({
      where: {
        status: TxnStatus.Pending,
        event: CdfEvent.OutcomePublished,
        challenges: {
          OR: [
            {
              challengeDepth: CategoryDepth.DayPickem,
            },
            {
              challengeDepth: CategoryDepth.WeekPickem,
            },
          ],
        },
      },
      select: {
        challengeId: true,
        scChallengeId: true,
        execCount: true,
        contracts: {
          select: {
            contractId: true,
            contractAddress: true,
            abiFile: true,
            networks: {
              select: {
                name: true,
                networkId: true,
              },
            },
          },
        },
        challenges: {
          select: {
            challengeResults: {
              select: {
                winCriteria: true,
              },
            },
            challengeParticipations: {
              select: {
                contracts: {
                  select: {
                    contractAddress: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (publishPickemResultsData) {
      if (publishPickemResultsData.execCount >= 2) {
        const message = `**URGENT** Challenge stuck in 'Processing Status' - Total Retries: ${publishPickemResultsData.execCount - 1} Inception_Challenge_Id: ${publishPickemResultsData.challengeId}`
        const messageData: JsonObject = {
          challengeId: publishPickemResultsData.challengeId,
          scChallengeId: publishPickemResultsData.scChallengeId,
          networkName: publishPickemResultsData.contracts.networks.name,
          contractAddress: publishPickemResultsData.contracts.contractAddress,
          tokenAddress: publishPickemResultsData.challenges.challengeParticipations[0].contracts.contractAddress,
        }
        await sendProcessingAlert(message, EVENTS.ALERT.PICKEM_RESULTS_TO_SC_PUBLISHED, messageData)
        logger.info(`Message sent to alert-worker`)
      }

      await contractDataFeed.updateMany({
        where: {
          challengeId: publishPickemResultsData.challengeId,
          event: CdfEvent.OutcomePublished,
        },
        data: {
          execCount: publishPickemResultsData.execCount ? publishPickemResultsData.execCount + 1 : 1,
        },
      })
      const winnersList: JsonObject[] = await challengeResults.findMany({
        where: {
          challengeId: publishPickemResultsData.challengeId,
          participantPosition: {
            gte: 1,
            lte: publishPickemResultsData.challenges.challengeResults[0].winCriteria,
          },
        },
        select: {
          participantPosition: true,
          challengeParticipations: {
            select: {
              challengeResultId: true,
              paidWalletAddress: true,
            },
          },
          challenge: {
            select: {
              challengeMode: true,
              gameId: true,
            },
          },
        },
        orderBy: {
          participantPosition: 'asc',
        },
      })
      console.log('--------pickem 3----------')
      if (winnersList.length > 0) {
        const firstPosition: string[] = []
        const secondPosition: string[] = []
        const thirdPosition: string[] = []
        const highProfit: number[] = []
        const mediumProfit: number[] = []
        const lowProfit: number[] = []
        const challengeResultIds: number[] = []
        let divideFirstPosition: number = 0
        let divideSecondPosition: number = 0
        let divideThirdPosition: number = 0
        winnersList.map((data: JsonObject) => {
          if (data.participantPosition === 1) {
            divideFirstPosition += 1
          }
          if (data.participantPosition === 2) {
            divideSecondPosition += 1
          }
          if (data.participantPosition === 3) {
            divideThirdPosition += 1
          }
        })
        console.log('--------pickem 4----------')
        winnersList.forEach((data: JsonObject) => {
          challengeResultIds.push(data.challengeParticipations[0].challengeResultId)
          if (data.participantPosition === 1) {
            firstPosition.push(data.challengeParticipations[0].paidWalletAddress)
            if (data.challenge.challengeMode === ChallengeMode.OneVsOne) {
              highProfit.push(100 / divideFirstPosition)
            } else if (data.challenge.challengeMode === ChallengeMode.Group && winnersList.length === 1) {
              highProfit.push(100 / divideFirstPosition)
            } else if (data.challenge.challengeMode === ChallengeMode.Group && winnersList.length === 2) {
              winnersList[winnersList.length - 1].participantPosition === 1
                ? highProfit.push(100 / divideFirstPosition)
                : highProfit.push(60 / divideFirstPosition)
            } else if (data.challenge.challengeMode === ChallengeMode.Group && winnersList.length >= 3) {
              if (winnersList[winnersList.length - 1].participantPosition === 1) {
                highProfit.push(100 / divideFirstPosition)
              } else if (winnersList[winnersList.length - 1].participantPosition === 2) {
                highProfit.push(60 / divideFirstPosition)
              } else if (winnersList[winnersList.length - 1].participantPosition === 3) {
                highProfit.push(50 / divideFirstPosition)
              }
            }
          }
          if (data.participantPosition === 2) {
            secondPosition.push(data.challengeParticipations[0].paidWalletAddress)
            if (data.challenge.challengeMode === ChallengeMode.Group && winnersList.length === 2) {
              mediumProfit.push(40 / divideSecondPosition)
            } else if (data.challenge.challengeMode === ChallengeMode.Group && winnersList.length >= 3) {
              if (winnersList[winnersList.length - 1].participantPosition === 2) {
                mediumProfit.push(40 / divideSecondPosition)
              } else if (winnersList[winnersList.length - 1].participantPosition === 3) {
                mediumProfit.push(30 / divideSecondPosition)
              }
            }
          }
          if (data.participantPosition === 3) {
            thirdPosition.push(data.challengeParticipations[0].paidWalletAddress)
            if (winnersList[winnersList.length - 1].participantPosition === 3) {
              lowProfit.push(20 / divideThirdPosition)
            }
          }
        })
        console.log('--------pickem 5----------')

        const publishPickemResultResponse: ChallengeFundsMoved[] | null = await resolveGroupChallenge(
          publishPickemResultsData.scChallengeId,
          [...firstPosition, ...secondPosition, ...thirdPosition],
          [...highProfit, ...mediumProfit, ...lowProfit],
          publishPickemResultsData.contracts.networks.name,
          publishPickemResultsData.contracts.contractAddress,
          publishPickemResultsData.challengeId,
          publishPickemResultsData.challenges.challengeParticipations[0].contracts.contractAddress,
          publishPickemResultsData.contracts.abiFile,
        )
        console.log('--------pickem 11----------')
        console.log('publishPickemResultResponse:: ')
        console.log(publishPickemResultResponse)
        if (publishPickemResultResponse && publishPickemResultResponse?.length > 0) {
          console.log('--------pickem 12----------')
          await updateScResponse(publishPickemResultsData, publishPickemResultResponse, challengeResultIds)
          logger.info(`Published challengeId ${publishPickemResultsData.challengeId} pickem results to SC.`)
        }
      } else if (winnersList.length === 0) {
        console.log('--------pickem 13----------')
        await cancelChallengeUpdateStatus(publishPickemResultsData)
      }
    }
  } catch (error) {
    logger.error('Publish pickem results to SC error: ', error)
    process.exit(1)
  }
  logger.info('Publish pickem results to SC got stopped.')

  // Delay 60 seconds to send alert before exit
  await delay(60000)
  process.exit(0)
}

// Update smartcontract response
const updateScResponse = async (
  publishPickemResultsData: JsonObject,
  publishPickemResultResponse: JsonObject[],
  challengeResultIds: number[],
): Promise<void> => {
  let winnerPromises = []
  let loserPromises = []
  const eventsData: { challengeId: number; paidWalletAddress: string; outcome: string }[] = []

  if (publishPickemResultResponse[0].winners.length > 0) {
    winnerPromises = await publishPickemResultResponse[0].winners.map((data: string, index: number) => {
      eventsData.push({
        challengeId: publishPickemResultsData.challengeId,
        paidWalletAddress: data,
        outcome: EVENTS.BET.WON,
      })
      return challengeParticipations.updateMany({
        where: {
          challengeId: publishPickemResultsData.challengeId,
          paidWalletAddress: data,
        },
        data: {
          participationWinLossQty: publishPickemResultResponse[0].winnersProfit[index],
          participationWinLossUsd: publishPickemResultResponse[0].winnersProfitInUSD[index],
          status: ChallengeParticipationStatus.Inactive,
        },
      })
    })
  }

  if (publishPickemResultResponse[0].losers.length > 0) {
    loserPromises = await publishPickemResultResponse[0].losers.map((data: string, index: number) => {
      eventsData.push({
        challengeId: publishPickemResultsData.challengeId,
        paidWalletAddress: data,
        outcome: EVENTS.BET.LOST,
      })
      return challengeParticipations.updateMany({
        where: {
          challengeId: publishPickemResultsData.challengeId,
          paidWalletAddress: data,
        },
        data: {
          participationWinLossQty: publishPickemResultResponse[0].losersLoss[index],
          participationWinLossUsd: publishPickemResultResponse[0].losersLossInUSD[index],
          status: ChallengeParticipationStatus.Inactive,
        },
      })
    })
  }

  const updateChallengeStatus = challenges.update({
    where: {
      challengeId: publishPickemResultsData.challengeId,
    },
    data: {
      finalOutcome: Outcome.Win,
      processingStatus: TxnStatus.Success,
    },
  })

  const updateWinnerOutcome = challengeResults.updateMany({
    where: {
      challengeId: publishPickemResultsData.challengeId,
      challengeResultId: {
        in: challengeResultIds,
      },
    },
    data: {
      participantOutcome: Outcome.Win,
      finalOutcome: Outcome.Win,
    },
  })

  const updateLoserOutcome = challengeResults.updateMany({
    where: {
      challengeId: publishPickemResultsData.challengeId,
      challengeResultId: {
        notIn: challengeResultIds,
      },
    },
    data: {
      participantOutcome: Outcome.Lose,
      finalOutcome: Outcome.Win,
    },
  })
  const contractDataFeedStatus = contractDataFeed.updateMany({
    where: {
      challengeId: publishPickemResultsData.challengeId,
      event: CdfEvent.OutcomePublished,
    },
    data: {
      finalOutcome: Outcome.Win,
      status: TxnStatus.Success,
    },
  })
  await prismaClient.$transaction([
    ...winnerPromises,
    ...loserPromises,
    updateChallengeStatus,
    updateWinnerOutcome,
    updateLoserOutcome,
    contractDataFeedStatus,
  ])
  for (const eachEvent of eventsData) {
    sendEventToWorker(eachEvent.challengeId, eachEvent.paidWalletAddress, eachEvent.outcome)
  }
}

const cancelChallengeUpdateStatus = async (cancelChallengesData: JsonObject): Promise<void> => {
  logger.info(`cancelChallengesData:: ${cancelChallengesData.reasonCode}`)

  const cancelResponse: ChallengeFundsMoved | null = await cancelChallenge(
    cancelChallengesData.scChallengeId,
    cancelChallengesData.contracts.networks.name,
    cancelChallengesData.contracts.contractAddress,
    cancelChallengesData.challengeId,
    CancelType.UserPart,
    cancelChallengesData.contracts.abiFile,
  )

  logger.info(`cancelResponse::`)
  logger.info(cancelResponse)

  if (cancelResponse && cancelResponse !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cancelUsdPromises: any = []
    const challengesStatus = challenges.update({
      where: {
        challengeId: cancelChallengesData.challengeId,
      },
      data: {
        finalOutcome: Outcome.CancelledOrDraw,
        status: ChallengeStatus.Cancelled,
        reasonCode: CancelReasonCode.NoPicks,
        processingStatus: TxnStatus.Success,
      },
    })

    if (cancelResponse.winners.length > 0) {
      cancelUsdPromises = await updateCanceledWinLoss(cancelResponse, cancelChallengesData.challengeId)
    }

    const contractDataFeedStatus = contractDataFeed.updateMany({
      where: {
        challengeId: cancelChallengesData.challengeId,
        event: CdfEvent.OutcomePublished,
      },
      data: {
        event: CdfEvent.CancelledOrDraw,
        finalOutcome: Outcome.CancelledOrDraw,
        status: TxnStatus.Success,
      },
    })

    const updateChallengeResults = challengeResults.updateMany({
      where: {
        challengeId: cancelChallengesData.challengeId,
      },
      data: {
        finalOutcome: Outcome.CancelledOrDraw,
      },
    })
    await prismaClient.$transaction([
      ...cancelUsdPromises,
      challengesStatus,
      updateChallengeResults,
      contractDataFeedStatus,
    ])
    logger.info(`ChallengeId ${cancelChallengesData.challengeId} got cancelled in SC.`)
  }
}

correlationIdMiddleware({}, null, async () => {
  await publishPickemResultsToSc()
})
