/* eslint-disable  @typescript-eslint/no-explicit-any */
import prismaClient, { Prisma } from '@duelnow/database'
import { getRedisKey } from '@duelnow/redis'
import { CancelType, SCChallengeStatus } from '@duelnow/utils'
import { cancelChallenge, cancelParticipation, getChallengeDetails } from '@duelnow/web3'
import { JsonObject } from 'swagger-ui-express'

import { logger } from './utils'

const { ChallengeParticipationStatus, ContractType, Status, ChallengeStatus, CdfEvent, TxnStatus } = Prisma
const {
  scTransactions,
  contractDataFeed,
  challengeParticipations,
  challenges,
  contracts,
  challengeGroupParticipants,
  challengeResults,
} = prismaClient

const verifyChallengeEventsFn = async (): Promise<any> => {
  try {
    const sportContracts = await contracts.findMany({
      where: {
        contractType: ContractType.Sport,
        status: Status.Active,
      },
      select: {
        contractAddress: true,
        contractId: true,
        abiFile: true,
        networks: {
          select: {
            name: true,
            networkId: true,
          },
        },
      },
    })

    if (sportContracts.length === 0) {
      throw new Error('There is no sport contract exist yet.')
    }

    for (let i = 0; i < sportContracts.length; i++) {
      const contractData = sportContracts[i]
      await verifyEvents(contractData)
    }
  } catch (error) {
    logger.error('cron-worker: Verify challenge events error: ', error)
    process.exit(1)
  }

  logger.debug('cron-worker: Verify challenge events cron stopped running.')
  process.exit(0) // Forcefully exiting the process for POD
}

const verifyEvents = async (contractData: JsonObject): Promise<void> => {
  const {
    networks: { name: networkName, networkId },
    contractAddress,
    contractId,
    abiFile,
  } = contractData

  try {
    logger.debug('cron-worker: Verify challenge events method got triggered.')

    const now = new Date() // Current timestamp
    const last5Minutes = new Date(now.getTime() - 5 * 60000) // Timestamp of last 5 minutes

    const scTransactionsData = await scTransactions.findMany({
      where: {
        AND: [
          {
            createdAt: {
              lte: last5Minutes.toISOString(), // less than last 5 minutes
            },
          },
          {
            rawData: {
              path: ['status'],
              equals: TxnStatus.Pending,
            },
          },
          {
            rawData: {
              path: ['networkId'],
              equals: networkId,
            },
          },
          {
            contractId,
          },
        ],
      },

      select: {
        id: true,
        contractId: true,
        rawData: true,
      },
    })

    logger.debug('cron-worker: scTransactions needs to be verified : ', scTransactionsData)

    for (let i = 0; i < scTransactionsData.length; i += 1) {
      const missedChallenge: any = scTransactionsData[i]

      logger.debug(`cron-worker: Missed challenge : ${missedChallenge}`)

      if (missedChallenge?.rawData.method === 'ChallengeCreated') {
        const existInCDF = await contractDataFeed.findFirst({
          where: {
            event: CdfEvent.Create,
            transactionHash: missedChallenge?.rawData?.transactionHash,
            contractId: missedChallenge?.rawData?.tokenContractId,
          },
          select: {
            contractDataFeedId: true,
            challengeId: true,
          },
        })

        logger.debug(`cron-worker: Missed challenge is exist in CDF : `, existInCDF)

        if (existInCDF) {
          logger.debug(`cron-worker: Case when missed challenge exist in CDF table`)
          if (existInCDF?.challengeId) {
            const challengeToUpdate = await challenges.findFirst({
              where: {
                challengeId: existInCDF?.challengeId,
                status: ChallengeStatus.AuthPending,
              },
            })
            if (challengeToUpdate) {
              const updatedChallenge = await challenges.update({
                where: {
                  challengeId: existInCDF?.challengeId,
                  status: ChallengeStatus.AuthPending,
                },
                data: {
                  status: ChallengeStatus.Pending,
                  scChallengeId: missedChallenge?.rawData?.scChallengeId,
                },
              })
              await challengeParticipations.updateMany({
                where: {
                  challengeId: updatedChallenge?.challengeId,
                  paidWalletAddress: missedChallenge?.rawData?.by,
                  contractId: missedChallenge?.rawData?.tokenContractId,
                },
                data: {
                  status: ChallengeParticipationStatus.Active,
                },
              })
            }

            const cdfToUpdate = await contractDataFeed.findFirst({
              where: {
                contractDataFeedId: existInCDF?.contractDataFeedId,
              },
            })

            if (cdfToUpdate) {
              await contractDataFeed.update({
                where: {
                  contractDataFeedId: existInCDF?.contractDataFeedId,
                },
                data: {
                  scChallengeId: missedChallenge?.rawData?.scChallengeId,
                  status: TxnStatus.Success,
                },
              })
            }
          }
          const updatedData = missedChallenge?.rawData
          updatedData['challengeCreatedFlag'] = true
          updatedData['status'] = null
          await scTransactions.update({
            where: {
              id: missedChallenge.id,
            },
            data: {
              rawData: updatedData,
            },
          })
        } else {
          logger.debug(`cron-worker: Case when missed challenge doesn't exist in CDF table`)
          const challengeForCancellation: any = await scTransactions.findFirst({
            where: {
              id: missedChallenge.id,
            },
            select: {
              rawData: true,
            },
          })

          logger.debug('cron-worker: challengeForCancellation = ', challengeForCancellation)

          if (
            challengeForCancellation?.rawData?.cancelTransactionHash === '' &&
            challengeForCancellation?.rawData?.challengeCreatedFlag === false &&
            challengeForCancellation?.rawData?.status === TxnStatus.Pending
          ) {
            logger.debug('cron-worker: missedChallenge.scChallengeId = ', missedChallenge.rawData?.scChallengeId)
            const challengeDetails: any = await getChallengeDetails(
              missedChallenge.rawData?.scChallengeId,
              networkName,
              contractAddress,
              abiFile,
            )

            logger.debug('cron-worker: challenge Details Status = ', parseInt(challengeDetails.status, 10))

            if (
              Number(challengeDetails.status) !== SCChallengeStatus.Canceled &&
              Number(challengeDetails.status) !== SCChallengeStatus.ResolvedAgainst &&
              Number(challengeDetails.status) !== SCChallengeStatus.ResolvedFor &&
              Number(challengeDetails.status) !== SCChallengeStatus.ResolvedDraw
            ) {
              const result = await cancelChallenge(
                missedChallenge.rawData?.scChallengeId,
                networkName,
                contractAddress,
                0,
                CancelType.FullReturn,
                abiFile,
              )
              if (result?.transactionHash) {
                const updatedData = missedChallenge?.rawData
                updatedData['status'] = TxnStatus.Success
                updatedData['cancelTransactionHash'] = result?.transactionHash
                updatedData['message'] = 'Cancelled because challenge was not created on backend'

                await scTransactions.update({
                  where: {
                    id: missedChallenge.id,
                  },
                  data: {
                    rawData: updatedData,
                  },
                })
              }
            } else {
              const updatedData = missedChallenge?.rawData
              updatedData['status'] = TxnStatus.Success
              updatedData['message'] = 'Challenge was cancelled or resolved already'

              await scTransactions.update({
                where: {
                  id: missedChallenge.id,
                },
                data: {
                  rawData: updatedData,
                },
              })
            }
          }
        }
      }

      if (missedChallenge.rawData?.method === 'ChallengeJoined') {
        const cdfData = await contractDataFeed.findFirst({
          where: {
            event: CdfEvent.Join,
            transactionHash: missedChallenge?.rawData?.transactionHash,
            contractId: missedChallenge?.rawData?.tokenContractId,
          },
          select: {
            contractDataFeedId: true,
            challengeId: true,
            status: true,
          },
        })
        if (cdfData?.challengeId) {
          if (cdfData.status === TxnStatus.Pending) {
            await contractDataFeed.update({
              where: {
                contractDataFeedId: cdfData?.contractDataFeedId,
              },
              data: {
                status: TxnStatus.Success,
              },
            })
          }
          const existInCP = await challengeParticipations.findFirst({
            where: {
              challengeId: cdfData?.challengeId,
              paidWalletAddress: `${missedChallenge?.rawData?.walletAddress}`,
            },
          })

          logger.debug(`cron-worker: existInCP : ${existInCP}`)

          if (existInCP) {
            logger.debug(`cron-worker: Case when missed challenge exist in CP table`)
            if (existInCP.status === Status.Inactive) {
              await challengeParticipations.update({
                where: {
                  participationId: existInCP.participationId,
                },
                data: {
                  status: ChallengeParticipationStatus.Active,
                },
              })
            }
            const joinChallengeForm: any = await getRedisKey(
              `challenge:${missedChallenge?.rawData?.scChallengeId}:join:${missedChallenge?.rawData?.walletAddress}:network:${networkId}:form`,
            )
            logger.debug(
              `cron-worker: joinChallengeForm got from redis cache when the challengeResultId doesn't exist in challengeParticipation : ${joinChallengeForm}`,
            )

            if (!existInCP?.challengeResultId) {
              const challengeResultData = await challengeResults.findFirst({
                where: {
                  challengeId: joinChallengeForm?.challengeId,
                },
              })

              const resultData = await challengeResults.create({
                data: {
                  challengeId: joinChallengeForm?.challengeId,
                  sportId: challengeResultData?.sportId,
                  winCriteria: challengeResultData?.winCriteria,
                  participantOutcome: joinChallengeForm?.participantOutcome,
                  categoryId: joinChallengeForm?.categoryId || null,
                  groupId: joinChallengeForm?.groupId || null,
                  subgroupId: joinChallengeForm?.subgroupId || null,
                  participantStatP1: joinChallengeForm?.participantStatP1 || null,
                  participantStatP2: joinChallengeForm?.participantStatP2 || null,
                  statAttribute: joinChallengeForm?.statAttribute || null,
                },
              })

              logger.debug(
                `cron-worker: Verify challenge challengeResults created when challengeResultId doesn't exist in challengeParticipation : ${resultData}`,
              )

              await challengeParticipations.update({
                where: {
                  participationId: existInCP?.participationId,
                },
                data: {
                  challengeResultId: resultData?.challengeResultId,
                },
              })

              logger.debug(
                `cron-worker: Verify challenge challengeResultId updated in CP when challengeResultId doesn't exist in challengeParticipation`,
              )
            }

            const challengeGroupParticipationExist = await challengeGroupParticipants.findFirst({
              where: {
                challengeGroupId: joinChallengeForm?.challengeGroupId,
                userId: joinChallengeForm?.participantAccountId,
              },
            })

            logger.debug(
              `cron-worker: Verify challenge challengeGroupParticipationExist ${challengeGroupParticipationExist}`,
            )

            if (!challengeGroupParticipationExist) {
              await challengeGroupParticipants.create({
                data: {
                  challengeGroupId: joinChallengeForm?.challengeGroupId,
                  userId: joinChallengeForm?.participantAccountId,
                },
              })

              logger.debug(
                `cron-worker: Verify challenge challengeGroupParticipants created when challengeResultId doesn't exist in challengeParticipation `,
              )
            }

            //Increase amount use case
            //conver wei to required unit here
            if (existInCP.participationValueQty !== missedChallenge.rawData.originalStakedQty) {
              challengeParticipations.update({
                where: {
                  participationId: existInCP.participationId,
                },
                data: {
                  participationValueQty: missedChallenge.rawData.originalStakedQty,
                },
              })
            }

            const updatedData = missedChallenge?.rawData
            updatedData['challengeParticipationFlag'] = true
            updatedData['status'] = TxnStatus.Success
            await scTransactions.update({
              where: {
                id: missedChallenge.id,
              },
              data: {
                rawData: updatedData,
              },
            })
          }
        } else {
          logger.debug(`cron-worker: Case when missed challenge participation doesn't exist in CDF table`)

          let joinChallengeForm: any = await getRedisKey(
            `challenge:${missedChallenge?.rawData?.scChallengeId}:join:${missedChallenge?.rawData?.walletAddress}:network:${networkId}:form`,
          )
          logger.debug(`cron-worker: joinChallengeForm got from redis cache : ${joinChallengeForm}`)

          if (joinChallengeForm) {
            logger.debug('cron-worker: Verify challenge joinChallengeForm : ', joinChallengeForm)
            joinChallengeForm = JSON.parse(joinChallengeForm)

            const challengeData = await challenges.findFirst({
              where: {
                challengeId: joinChallengeForm.challengeId,
              },
            })

            if (challengeData?.status === ChallengeStatus.Pending && joinChallengeForm.isReady === true) {
              await challenges.update({
                where: {
                  challengeId: joinChallengeForm?.challengeId,
                },
                data: {
                  status: ChallengeStatus.Ready,
                },
              })
              logger.debug(`cron-worker: joinChallengeForm challenge status updated to ${joinChallengeForm?.status}`)
            }

            await contractDataFeed.create({
              data: {
                challengeId: joinChallengeForm.challengeId,
                walletAddress: joinChallengeForm?.walletAddress,
                contractId: joinChallengeForm?.contractId,
                tokenStakedQty: joinChallengeForm.participationValueQty,
                scChallengeId: joinChallengeForm.scChallengeId,
                transactionHash: missedChallenge?.rawData?.transactionHash,
                participantOutcome: joinChallengeForm.participantOutcome,
                event: CdfEvent.Join,
                status: TxnStatus.Success,
              },
            })

            const challengeResultData = await challengeResults.findFirst({
              where: {
                challengeId: joinChallengeForm?.challengeId,
              },
            })

            logger.debug('cron-worker: Verify challenge challengeResultData : ', challengeResultData)

            const resultData = await challengeResults.create({
              data: {
                challengeId: joinChallengeForm?.challengeId,
                sportId: challengeResultData?.sportId,
                winCriteria: challengeResultData?.winCriteria,
                participantOutcome: joinChallengeForm?.participantOutcome,
                categoryId: joinChallengeForm?.categoryId || null,
                groupId: joinChallengeForm?.groupId || null,
                subgroupId: joinChallengeForm?.subgroupId || null,
                participantStatP1: joinChallengeForm?.participantStatP1 || null,
                participantStatP2: joinChallengeForm?.participantStatP2 || null,
                statAttribute: joinChallengeForm?.statAttribute || null,
              },
            })

            logger.debug('cron-worker: Verify challenge challengeResults created : ', resultData)

            await challengeParticipations.create({
              data: {
                challengeId: joinChallengeForm?.challengeId,
                challengeGroupId: joinChallengeForm?.challengeGroupId,
                paidWalletAddress: `${joinChallengeForm?.walletAddress}`,
                oddsFlag: joinChallengeForm?.oddsFlag,
                participantOdds: joinChallengeForm?.participantOdds,
                multiTokenFlag: joinChallengeForm?.multiTokenFlag,
                contractId: joinChallengeForm?.contractId,
                exchangeRate: joinChallengeForm?.exchangeRate || 0,
                participationValueQty: joinChallengeForm?.participationValueQty,
                participationValueUsd: joinChallengeForm?.participationValueUsd,
                participationWinLossQty: null,
                participationWinLossUsd: null,
                challengeDepth: joinChallengeForm?.challengeDepth,
                status: ChallengeParticipationStatus.Active,
                challengeResultId: resultData?.challengeResultId,
                participantRole: joinChallengeForm?.joinChallengeForm,
              },
            })

            logger.debug('cron-worker: Verify challenge nflChallengeParticipation created')

            await challengeGroupParticipants.create({
              data: {
                challengeGroupId: joinChallengeForm?.challengeGroupId,
                userId: joinChallengeForm?.participantAccountId,
              },
            })

            logger.debug('cron-worker: Verify challenge challengeGroupParticipants created')

            const updatedData = missedChallenge?.rawData
            updatedData['challengeParticipationFlag'] = true
            updatedData['status'] = TxnStatus.Success

            await scTransactions.update({
              where: {
                id: missedChallenge.id,
              },
              data: {
                rawData: updatedData,
              },
            })

            logger.debug('cron-worker: Verify challenge sCMissingChallengeMap updated')
          } else {
            const challengeDetails: any = await getChallengeDetails(
              missedChallenge.rawData?.scChallengeId,
              networkName,
              contractAddress,
              abiFile,
            )

            logger.debug('cron-worker: challenge Details Status = ', parseInt(challengeDetails.status, 10))

            if (
              Number(challengeDetails.status) !== SCChallengeStatus.Canceled &&
              Number(challengeDetails.status) !== SCChallengeStatus.ResolvedAgainst &&
              Number(challengeDetails.status) !== SCChallengeStatus.ResolvedFor &&
              Number(challengeDetails.status) !== SCChallengeStatus.ResolvedDraw
            ) {
              const result = await cancelParticipation(
                missedChallenge.rawData?.walletAddress,
                missedChallenge.rawData?.scChallengeId,
                networkName,
                contractAddress,
                CancelType.FullReturn,
                abiFile,
              )
              if (result.transactionHash) {
                const updatedData = missedChallenge?.rawData
                updatedData['status'] = TxnStatus.Success
                updatedData['cancelParticipationTransactionHash'] = result.transactionHash
                updatedData['message'] = 'Participation cancelled because challenge was not created on backend'

                await scTransactions.update({
                  where: {
                    id: missedChallenge.id,
                  },
                  data: {
                    rawData: updatedData,
                  },
                })
              }
            } else {
              const updatedData = missedChallenge?.rawData
              updatedData['status'] = TxnStatus.Success
              updatedData['message'] = 'Challenge was cancelled or resolved already'

              await scTransactions.update({
                where: {
                  id: missedChallenge.id,
                },
                data: {
                  rawData: updatedData,
                },
              })
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error('cron-worker: Verify challenge events error: ', error)
  }
}

verifyChallengeEventsFn()
