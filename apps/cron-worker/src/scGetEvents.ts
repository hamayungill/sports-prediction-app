/* eslint-disable  @typescript-eslint/no-explicit-any */
import prismaClient, { BlockchainNetworks, Prisma } from '@duelnow/database'
import { IKafkaMessage } from '@duelnow/kafka-client'
import { getRates } from '@duelnow/rates'
import { getRedisKey, setRedisKey } from '@duelnow/redis'
import { EVENTS, EventCaller, PriceResult, TOPICS, delay, getSystemIp } from '@duelnow/utils'
import { fromWeiToEther, gePastEvents, getCurrentBlockNumber } from '@duelnow/web3'
import { JsonObject } from 'swagger-ui-express'
import { v4 as uuidv4 } from 'uuid'

import { BlockChainEvents, getTokenAddressByScChallengeId, logger, producer } from './utils'
import { getTokenNameByTokenAddress } from './utils/helper'

const { TxnStatus, ContractType, Status } = Prisma
const { challenges, contracts, scTransactions, users } = prismaClient

const getChallengeEventsFn = async (): Promise<any> => {
  try {
    const sportContracts = await contracts.findMany({
      where: {
        contractType: ContractType.Sport,
      },
      include: {
        networks: true,
      },
    })

    if (sportContracts.length === 0) {
      throw new Error('There is no contract exist yet.')
    }

    for (const contractData of sportContracts) {
      await getEvents(contractData)
    }
  } catch (error) {
    logger.error('Get challenge events error: ', error)
    process.exit(1)
  }

  logger.info('Get challenge events cron stopped running.')
  process.exit(0) // Forcefully exiting the process for POD
}

const getEvents = async (contractData: Prisma.Contracts): Promise<void> => {
  const {
    networks: { name: networkName, networkId },
    contractAddress,
    contractId,
    abiFile,
  }: any = contractData
  try {
    logger.info('Get challenge events method got triggered.')

    const latestBlockNumber: number = Number(await getCurrentBlockNumber(networkName))
    const targetBlock = await getRedisKey(`network:${networkId}:contract:${contractAddress}:block:last`)
    let targetBlockNumber: number = Number(targetBlock) || 0

    if (targetBlockNumber === 0) {
      let blocksAgo = 0
      if (networkName == BlockchainNetworks.Ethereum) {
        blocksAgo = Math.floor((30 * 60) / 15)
      }

      if (networkName == BlockchainNetworks.Arbitrum) {
        blocksAgo = Math.floor((30 * 60) / 2)
      }

      targetBlockNumber = latestBlockNumber - blocksAgo
    }

    logger.info('[scGetEvents] target block number : ', targetBlockNumber)
    logger.info('[scGetEvents] latest block number : ', latestBlockNumber)
    if (targetBlockNumber > latestBlockNumber) {
      return
    }

    const supportedTokensList = await contracts.findMany({
      where: {
        networkId,
        contractType: ContractType.Token,
        status: Status.Active,
      },
      select: {
        tokenName: true,
        contractAddress: true,
        contractId: true,
      },
    })

    const allEvents: any = await gePastEvents(
      targetBlockNumber,
      latestBlockNumber,
      'allEvents',
      networkName,
      contractAddress,
      abiFile,
    )

    const challengeCreateEvents = allEvents.filter((e: any) => e.event == BlockChainEvents.ChallengeCreated)

    const eventsTypes: any = abiFile?.filter((e: Record<string, any>) => {
      if (e.type == 'event') {
        return e
      }
    })
    let eventsData: any = []
    for (let index = 0; index < allEvents.length; index++) {
      const event = allEvents[index]
      await delay(500)

      const returnVal: Record<string, any> = {}
      const [type] = eventsTypes.filter((eventType: Record<string, any>) => eventType.name === event.event)
      if (event.event === BlockChainEvents.ChallengeCreated || event.event === BlockChainEvents.ChallengeJoined) {
        returnVal.challengeParticipationFlag = false
        returnVal.challengeCreatedFlag = false
        returnVal.status = TxnStatus.Pending
        returnVal.cancelTransactionHash = ''
      }
      const [createEvent] = challengeCreateEvents.filter(
        (e: any) => e?.returnValues?.challengeId === event.returnValues?.challengeId,
      )

      for (const input of type.inputs) {
        if (input.type == 'address[]') {
          returnVal[input.name] = event.returnValues[input.name]
        }

        //Here we are converting the usigned integer values (solidity types for numbers) to the JS values
        if (['uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256'].includes(input.type)) {
          if (
            ((event.event === BlockChainEvents.ChallengeJoined ||
              event.event === BlockChainEvents.AdminWithdrawn ||
              event.event === BlockChainEvents.AdminReceived ||
              event.event === BlockChainEvents.UserWithdrawn) &&
              input.name === 'amount') ||
            (event.event === BlockChainEvents.BetAmountIncreased &&
              (input.name === 'increasedAmount' || input.name === 'newTotalAmount'))
          ) {
            let token = event.returnValues?.token
            let tokenName = null
            if (!token) {
              const tokenData: Record<string, any> | null = await getTokenAddressByScChallengeId(
                Number(event.returnValues?.challengeId),
                contractId,
              )

              if (tokenData) {
                token = tokenData?.contracts?.contractAddress
                tokenName = tokenData?.contracts?.tokenName
                logger.info(`when token data exists : ${JSON.stringify(tokenData)}`)
              } else {
                token = createEvent?.returnValues.token
                logger.info(`when token data doesn't exist, value of token is ${token} and networkId is ${networkId}`)
                tokenName = await getTokenNameByTokenAddress(token, networkId)
                logger.info(`tokenName getting from the getTokenNameByTokenAddress() is ${tokenName}`)
              }
            } else {
              tokenName = await getTokenNameByTokenAddress(token, networkId)
            }
            returnVal[input.name] = Number(await fromWeiToEther(event.returnValues[input.name], networkName, token))
            logger.info(`ether value is ${returnVal[input.name]}`)
            logger.info(`tokenName : ${tokenName}`)
            const rate: PriceResult[] = await getRates([tokenName])
            returnVal.originalStakedQty = Number(returnVal[input.name])
            logger.info(`originalStakedQty value is ${returnVal.originalStakedQty}`)
            const usdPrice = rate[0]?.usdPrice ?? 0
            logger.info(`rates getting from getRates is ${JSON.stringify(rate)}`)
            logger.info(`usdPrice is ${JSON.stringify(rate[0]?.usdPrice)}`)
            returnVal.originalStakedQtyInUSD = usdPrice * returnVal.originalStakedQty
          } else {
            if (
              (event.event === BlockChainEvents.ChallengeJoined || event.event === BlockChainEvents.ChallengeCreated) &&
              input.name === 'inputStakedQty'
            ) {
              const token = event.returnValues?.token
              const tokenName = await getTokenNameByTokenAddress(token, networkId)
              returnVal[input.name] = Number(await fromWeiToEther(event.returnValues[input.name], networkName, token))
              if (tokenName) {
                const rate: PriceResult[] = await getRates([tokenName])
                const usdPrice = rate[0]?.usdPrice ?? 0
                returnVal.inputStakedQtyInUSD = usdPrice * returnVal.inputStakedQty
              }
            } else {
              returnVal[input.name] = Number(event.returnValues[input.name])
            }
          }
        }

        //Here we are converting the usigned integer array values (solidity types for numbers) to the JS values
        if (['uint8[]', 'uint16[]', 'uint32[]', 'uint64[]', 'uint128[]', 'uint256[]'].includes(input.type)) {
          if (
            (event.event === BlockChainEvents.ChallengeFundsMoved &&
              (input.name === 'winnersProfit' || input.name === 'losersLoss')) ||
            (event.event === BlockChainEvents.ReferralsEarned && input.name === 'referrelCommissions')
          ) {
            let token = event.returnValues?.token
            let tokenName = null
            if (!token) {
              const tokenData: Record<string, any> | null = await getTokenAddressByScChallengeId(
                Number(event.returnValues?.challengeId),
                contractId,
              )
              if (tokenData) {
                token = tokenData?.contracts?.contractAddress
                tokenName = tokenData?.contracts?.tokenName
              } else {
                token = createEvent?.returnValues.token
                tokenName = await getTokenNameByTokenAddress(token, networkId)
              }
            }
            const rate: PriceResult[] = await getRates([tokenName])

            returnVal[input.name] = await Promise.all(
              event.returnValues[input.name]?.map(async (val: bigint) => {
                const originalStakedQty = Number(await fromWeiToEther(val.toString(), networkName, token))
                logger.info(`originalStakedQty when token is ${token} and value is ${val.toString()}`)
                const usdPrice = rate[0]?.usdPrice ?? 0
                logger.info(`usdPrice while in challenge funds moved values conversions : ${usdPrice}`)
                return {
                  originalStakedQty,
                  valueInUSD: usdPrice * originalStakedQty,
                }
              }),
            )
          } else {
            returnVal[input.name] = await Promise.all(
              event.returnValues[input.name]?.map(async (val: bigint) => Number(val)),
            )
          }
        }

        //Here we are converting the solidity address type to string
        if (input.type === 'address') {
          returnVal[input.name] = event.returnValues[input.name].toString()
        }
        if (
          event.event === BlockChainEvents.AdminShareRulesUpdated &&
          input.name === 'adminShareRules' &&
          input.type === 'tuple'
        ) {
          delete event.returnValues[input.name]['0']
          delete event.returnValues[input.name]['1']
          delete event.returnValues[input.name]['__length__']
          let { thresholds, percentages } = event.returnValues[input.name]
          thresholds = thresholds?.map((e: bigint) => Number(e))
          percentages = percentages?.map((e: bigint) => Number(e))
          returnVal[input.name] = { thresholds, percentages }
        }

        //If the token event is emitted, we are geting the other details of the token e.g. name, contract id, and storing along with event details
        if (input.name === 'token') {
          const filteredToken = supportedTokensList.filter(
            (obj: any) => obj.contractAddress.toLowerCase() === event.returnValues?.token?.toLowerCase(),
          )

          if (filteredToken && filteredToken.length) {
            returnVal.tokenType = filteredToken[0]?.tokenName || ''
            returnVal.tokenAddress = filteredToken[0]?.contractAddress || ''
            returnVal.tokenContractId = filteredToken[0]?.contractId || ''
            delete returnVal.token
          }
        }

        //this condition is for the backword compaibility of the SC without new events added, this code can get obslete once the new smart contract with more events is deployed, and all the previous events from old smart contract are synced.
        if (event.event === BlockChainEvents.ChallengeJoined) {
          const filteredToken = supportedTokensList.filter(
            (obj: any) => obj.contractAddress.toLowerCase() === createEvent?.returnValues.token?.toLowerCase(),
          )

          if (filteredToken && filteredToken.length) {
            returnVal.tokenType = filteredToken[0]?.tokenName || ''
            returnVal.tokenAddress = filteredToken[0]?.contractAddress || ''
            returnVal.tokenContractId = filteredToken[0]?.contractId || ''
            delete returnVal.token
          }
        }

        if (
          (event.event === BlockChainEvents.ChallengeCreated || event.event === BlockChainEvents.ChallengeJoined) &&
          input.name == 'by'
        ) {
          returnVal.walletAddress = event.returnValues[input.name]
          delete returnVal?.by
        }

        if (
          (event.event === BlockChainEvents.ChallengeCreated || event.event === BlockChainEvents.ChallengeJoined) &&
          input.name == 'challengeId'
        ) {
          delete returnVal?.challengeId
          returnVal.scChallengeId = `${Number(event.returnValues[input.name])}`
        }
      }

      eventsData.push({
        ...returnVal,
        transactionHash: event?.transactionHash,
        method: event?.event,
        networkId,
        blockNum: Number(event?.blockNumber),
      })
    }

    const challengeJoinedEvents = eventsData.filter((e: any) => e.method == BlockChainEvents.ChallengeJoined)
    const eventsToBeRemoved: any[] = []
    eventsData = eventsData?.map((e: any) => {
      if (e.method === BlockChainEvents.ChallengeCreated) {
        const filterChallengeJoinedEvents = challengeJoinedEvents.filter((joinedEvent: any) => {
          return e.transactionHash === joinedEvent.transactionHash
        })
        if (filterChallengeJoinedEvents.length) {
          eventsToBeRemoved.push(e.transactionHash)
          e.originalStakedQty = filterChallengeJoinedEvents[0].originalStakedQty
          e.originalStakedQtyInUSD = filterChallengeJoinedEvents[0].originalStakedQtyInUSD
        }
      }
      return e
    })
    eventsData = eventsData.filter((e: any) => {
      return !eventsToBeRemoved.includes(e.transactionHash) || e.method !== BlockChainEvents.ChallengeJoined
    })

    logger.info(`Inserting blockchain events in database.Total of ${eventsData.length} events`)
    for (let i = 0; i < eventsData.length; i += 1) {
      const event = eventsData[i]
      const filters = [
        {
          rawData: {
            path: ['transactionHash'],
            equals: event.transactionHash,
          },
        },
        {
          rawData: {
            path: ['networkId'],
            equals: event.networkId,
          },
        },
      ]

      logger.info('event ReferralsEarned')
      if (event.method === BlockChainEvents.ReferralsEarned) {
        logger.info('event', event)
        if (event?.referrers.length > 0) {
          const usersData = await users.findMany({
            where: {
              walletAddress: {
                in: event?.referrers,
              },
            },
            select: {
              userId: true,
            },
          })
          const challengeData = await challenges.findFirst({
            where: {
              scChallengeId: event?.challengeId?.toString(),
              contractId,
            },
            select: {
              challengeId: true,
            },
          })
          if (usersData) {
            usersData?.forEach((user: JsonObject, index: number) => {
              if (user.userId) {
                const kafkaHeaders = {
                  caller: EventCaller.System,
                  callerId: user.userId,
                  ip: getSystemIp(),
                  correlationId: uuidv4(),
                }
                const kafkaMessage: IKafkaMessage = {
                  key: user.userId,
                  value: {
                    eventName: EVENTS.TRACKING.REFERRAL_BONUS_EARNED,
                    data: {
                      challenge: {
                        challengeId: challengeData?.challengeId,
                        networkId: event?.networkId,
                        tokenType: event?.tokenType,
                        tokenContractId: event?.tokenContractId,
                      },
                      referral: {
                        commissionTokenQty: event?.referrelCommissions[index].originalStakedQty,
                      },
                    },
                  },
                }

                producer.sendMessage(TOPICS.TRACKING.USER.EVENTS, kafkaMessage, kafkaHeaders)
              }
            })
          }
        }
      }

      if (event.method !== BlockChainEvents.ChallengeJoined) {
        filters.push({
          rawData: {
            path: ['method'],
            equals: event.method,
          },
        })
      } else {
        const extendedFilter: any = {}
        extendedFilter['OR'] = [
          {
            rawData: {
              path: ['method'],
              equals: BlockChainEvents.ChallengeCreated,
            },
          },
          {
            rawData: {
              path: ['method'],
              equals: BlockChainEvents.ChallengeJoined,
            },
          },
        ]
        filters.push({ ...extendedFilter })
      }

      const eventExist = await scTransactions.findFirst({
        where: {
          AND: [...filters],
        },
      })

      if (!eventExist?.id) {
        const scTxData = {
          contractId: contractId,
          rawData: event,
        }

        logger.info(`scTxData while inserting in scTransactions table: `, JSON.stringify(scTxData))

        await scTransactions.create({
          data: scTxData,
        })
      } else {
        logger.info(`event already exist in scTransactions table with id : `, eventExist?.id)
      }
    }

    await setRedisKey(`network:${networkId}:contract:${contractAddress}:block:last`, latestBlockNumber.toString())
  } catch (error) {
    logger.error('Get challenge events error: ', error)
  }
}

getChallengeEventsFn()
/**
 * Adding this comment to trigger the CI/CD for cron-worker
 */
