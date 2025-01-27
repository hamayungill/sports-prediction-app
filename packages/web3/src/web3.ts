/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-named-as-default*/
import fs from 'fs'
import path from 'path'

import prismaClient, { BlockchainNetworks, Prisma } from '@duelnow/database'
import { getRates } from '@duelnow/rates'
import { getRedisKey, setRedisKey } from '@duelnow/redis'
import { PriceResult, SCChallengeStatus, ZeroAddress, delay } from '@duelnow/utils'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import Web3, { TransactionReceipt, WebSocketProvider } from 'web3'

import { erc20Abi } from './utils/abi'
import {
  arbitrumApiUrl,
  arbitrumWebSocketUrl,
  ethereumApiUrl,
  ethereumWebSocketUrl,
  infuraApiKey,
  scAdminPrivateKey,
} from './utils/envs'
import { FetchHttpProvider, createJWT } from './utils/helper'
import { logger } from './utils/logger'
import { ChallengeFundsMoved, erc20AbiTypes } from './utils/types'
const { scTransactions, challenges, contracts, users } = prismaClient
const { ContractType, Status } = Prisma
const erc20contractAbi = erc20Abi as unknown as erc20AbiTypes

/**
 * @function cancelChallenge
 * @param {string} challengeId - The smart contract challenge ID.
 * @param {BlockchainNetworks} networkName - name of the network.
 * @param {string} contractAddress - The address of the smart contract.
 * @param {number} internalChallengeId - The internal system challenge ID.
 * @param {number} cancelType - The type of cancellation to perform.
 * @param {any} abi - The contract ABI to interact with the contract.
 * @returns {Promise<ChallengeFundsMoved | null>} - Returns a Promise that resolves to ChallengeFundsMoved object or null if cancellation fails.
 * This function cancels a smart contract challenge and processes the associated blockchain events to return details about the transaction, including winners and their profits.
 */
export const cancelChallenge = async (
  challengeId: string,
  networkName: BlockchainNetworks,
  contractAddress: string,
  internalChallengeId: number,
  cancelType: number,
  abi: any,
): Promise<ChallengeFundsMoved | null> => {
  logger.debug(
    `Cancel request received for scChallengeId: ${challengeId}, networkName: ${networkName}, contractAddress: ${contractAddress}, internalChallengeId: ${internalChallengeId}`,
  )
  const web3 = await initialize(networkName)
  const contract = new web3.eth.Contract(abi, contractAddress)

  const challengeData: any = await getChallengeDetails(challengeId, networkName, contractAddress, abi)
  const { status } = challengeData

  logger.info(`cancelChallenge: status - ${status}`)

  const challengeExist = await challenges.findFirst({
    where: {
      challengeId: internalChallengeId,
      scChallengeId: challengeId,
    },
    include: {
      contracts: true,
    },
  })
  if (!challengeExist) {
    throw new Error(
      `ChallengeCanceled: challenge doesn't for challengeId: ${internalChallengeId} and scChallengeId: ${challengeId}`,
    )
  }

  if (Number(status) === SCChallengeStatus.Canceled) {
    const eventExist: any = await scTransactions.findFirst({
      where: {
        AND: [
          {
            rawData: {
              path: ['challengeId'],
              equals: Number(challengeId),
            },
          },
          {
            rawData: {
              path: ['method'],
              equals: 'ChallengeFundsMoved',
            },
          },
        ],
        contractId: Number(challengeExist?.contractId),
      },
    })

    logger.info(`ChallengeCanceled: event: ${JSON.stringify(eventExist)}`)
    if (eventExist) {
      return {
        transactionHash: eventExist.rawData?.transactionHash,
        challengeId: Number(eventExist.rawData?.challengeId),
        winners: eventExist.rawData?.winners || [],
        winnersProfit:
          (await Promise.all(
            eventExist.rawData?.winnersProfit?.map(async (profit: Record<string, number>) => profit?.originalStakedQty),
          )) || [],
        winnersProfitInUSD:
          (await Promise.all(
            eventExist.rawData?.winnersProfit?.map(async (profit: Record<string, number>) => profit?.valueInUSD),
          )) || [],
        losers: [],
        losersLoss: [],
        losersLossInUSD: [],
      }
    }

    logger.info(`ChallengeCanceled: Challenge with id internal challenge id: ${internalChallengeId} already cancelled.`)

    const txHash: string | null = await getRedisKey(`ChallengeCanceled:${internalChallengeId}:txHash`)
    if (!txHash) {
      throw new Error(
        `ChallengeCanceled: Tx Hash is not present in redis against internalChallengeId: ${internalChallengeId} for further processing.`,
      )
    }
    const response = await getTransactionHashResponse(txHash, 'ChallengeFundsMoved', networkName, contractAddress, abi)

    let filters = null
    if (response[0]?.returnValues?.token) {
      filters = {
        contractAddress: response[0]?.returnValues?.token,
        networkId: challengeExist.contracts?.networkId,
      }
    } else {
      const scEvent: any = await scTransactions.findFirst({
        where: {
          AND: [
            {
              rawData: {
                path: ['scChallengeId'],
                equals: `${challengeId}`,
              },
            },
            {
              rawData: {
                path: ['method'],
                equals: 'ChallengeCreated',
              },
            },
            { contractId: Number(challengeExist.contracts?.contractId) },
          ],
        },
      })
      if (!scEvent) {
        throw new Error(
          `ChallengeCanceled: SC Event doesn't exit for the scChallengeId: ${challengeId}, method: ChallengeCreated and contractId: ${challengeExist?.contracts?.contractId}`,
        )
      }

      filters = {
        contractId: scEvent?.rawData?.tokenContractId,
      }
    }

    const contractData: any = await contracts.findFirst({
      where: {
        ...filters,
      },
    })

    logger.info(`ChallengeCanceled: contractData when txhash exists: ${JSON.stringify(contractData)}`)

    const tokenName: string | null = contractData?.tokenName
    if (!tokenName) {
      throw new Error(`ChallengeCanceled: tokenName is invalid : ${tokenName}`)
    }

    const rate: PriceResult[] = await getRates([tokenName])
    const usdPrice = rate[0]?.usdPrice ?? 0
    return {
      transactionHash: txHash,
      challengeId: Number(response[0]?.returnValues?.challengeId),
      winners: response[0]?.returnValues?.winners || [],
      winnersProfit:
        (await Promise.all(
          response[0]?.returnValues?.winnersProfit?.map(async (profit: bigint) =>
            Number(await fromWeiToEther(profit.toString(), networkName, contractData?.contractAddress)),
          ),
        )) || [],
      winnersProfitInUSD:
        (await Promise?.all(
          response[0]?.returnValues?.winnersProfit?.map(
            async (profit: bigint) =>
              usdPrice * Number(await fromWeiToEther(profit.toString(), networkName, contractData?.contractAddress)),
          ),
        )) || [],
      losers: [],
      losersLoss: [],
      losersLossInUSD: [],
    }
  }

  const txData = contract.methods.cancelChallenge(challengeId, cancelType).encodeABI()
  const adminAccount = web3.eth.accounts.privateKeyToAccount(scAdminPrivateKey || '')
  const gasEstimate = await contract.methods
    .cancelChallenge(challengeId, cancelType)
    .estimateGas({ from: adminAccount.address })
  console.log('----line 2-----', gasEstimate)

  const gasPrice = await web3.eth.getGasPrice()
  console.log('----line 3-----', gasPrice)
  const nonce = await web3.eth.getTransactionCount(adminAccount.address)

  // specify the transaction parameters
  const txParams = {
    from: adminAccount.address,
    to: contractAddress,
    data: txData,
    gasPrice,
    gas: gasEstimate,
    nonce,
  }
  console.log('----line 4-----', txParams)
  // sign and send the transaction
  return adminAccount
    .signTransaction(txParams)
    .then(async (signedTx) => {
      const receipt: any = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)

      logger.info(
        `ChallengeCanceled: Got txhash: ${receipt.transactionHash} against challengeId: ${internalChallengeId}`,
      )

      await setRedisKey(`ChallengeCanceled:${internalChallengeId}:txHash`, receipt.transactionHash, 3600)

      const response = await getTransactionHashResponse(
        receipt.transactionHash,
        'ChallengeFundsMoved',
        networkName,
        contractAddress,
        abi,
      )

      let filters = null
      if (response[0]?.returnValues?.token) {
        filters = {
          contractAddress: response[0]?.returnValues?.token,
          networkId: challengeExist.contracts?.networkId,
        }
      } else {
        const scEvent: any = await scTransactions.findFirst({
          where: {
            AND: [
              {
                rawData: {
                  path: ['scChallengeId'],
                  equals: `${challengeId}`,
                },
              },
              {
                rawData: {
                  path: ['method'],
                  equals: 'ChallengeCreated',
                },
              },
            ],
            contractId: Number(challengeExist?.contracts?.contractId),
          },
        })

        if (!scEvent) {
          throw new Error(
            `ChallengeCanceled: SC Event doesn't exit in first try for the scChallengeId: ${challengeId}, method: ChallengeCreated and contractId: ${challengeExist?.contracts?.contractId}`,
          )
        }

        filters = {
          contractId: scEvent?.rawData?.tokenContractId,
        }
      }

      const contractData: any = await contracts.findFirst({
        where: {
          ...filters,
        },
      })

      logger.info(`ChallengeCanceled: contractData in first try: ${JSON.stringify(contractData)}`)

      const tokenName: string | null = contractData?.tokenName
      if (!tokenName) {
        throw new Error(`ChallengeCanceled: tokenName is invalid: ${tokenName}`)
      }

      const rate: PriceResult[] = await getRates([tokenName])
      const usdPrice = rate[0]?.usdPrice ?? 0

      logger.info('Challenge Cancelled Successfully')
      return {
        transactionHash: receipt?.transactionHash,
        challengeId: Number(response[0]?.returnValues?.challengeId),
        winners: response[0]?.returnValues?.winners || [],
        winnersProfit:
          (await Promise.all(
            response[0]?.returnValues?.winnersProfit?.map(async (profit: bigint) =>
              Number(await fromWeiToEther(profit.toString(), networkName, contractData?.contractAddress)),
            ),
          )) || [],
        winnersProfitInUSD:
          (await Promise.all(
            response[0]?.returnValues?.winnersProfit?.map(
              async (profit: bigint) =>
                usdPrice * Number(await fromWeiToEther(profit.toString(), networkName, contractData?.contractAddress)),
            ),
          )) || [],
        losers: [],
        losersLoss: [],
        losersLossInUSD: [],
      }
    })
    .catch((error) => {
      logger.error('Transaction error in cancel challenge', error)
      logger.error(
        `Cancel request error for scChallengeId: ${challengeId}, networkName: ${networkName}, contractAddress: ${contractAddress}, internalChallengeId: ${internalChallengeId}`,
      )
      return null
    })
}

/**
 * @function initialize
 * @param {BlockchainNetworks} networkName - The URL for the Web3 provider.
 * @param {string} isWeb3Socket - Specify true to initialize the web3socket or false to skip its initialization.
 * @returns {Promise<Web3>} - Returns a Promise that resolves to a Web3 instance.
 * Initializes a Web3 instance with a custom HTTP provider using a JWT for authentication.
 */
const initialize = async (networkName: BlockchainNetworks, isWeb3Socket?: boolean): Promise<Web3> => {
  const jwtToken = await createJWT()
  const resourceUrl = getResourceUrl(networkName, isWeb3Socket)
  logger.info('resourceUrl : ', resourceUrl)
  if (!resourceUrl) {
    throw new Error(`${isWeb3Socket ? 'Infura web socket' : 'Infura API'} Url is invalid`)
  }
  const customProvider = new FetchHttpProvider(resourceUrl, jwtToken)
  let web3 = null
  if (isWeb3Socket) {
    web3 = new Web3(new WebSocketProvider(resourceUrl))
  } else {
    web3 = new Web3(customProvider as any)
  }
  return web3
}

/**
 * @function getResourceUrl
 * @param {BlockchainNetworks} networkName - The URL for the Web3 provider.
 * @param {string} isWeb3Socket - Specify true to get the web3socket or false to get the API Url.
 * @returns {string | null} - Returns a Promise that resolves to a Web3 instance.
 */
const getResourceUrl = (networkName: BlockchainNetworks, isWeb3Socket?: boolean): string | null => {
  switch (networkName) {
    case BlockchainNetworks.Ethereum:
      if (isWeb3Socket) {
        return `${ethereumWebSocketUrl}${infuraApiKey}`
      } else {
        return `${ethereumApiUrl}${infuraApiKey}`
      }
    case BlockchainNetworks.Arbitrum:
      if (isWeb3Socket) {
        return `${arbitrumWebSocketUrl}${infuraApiKey}`
      } else {
        return `${arbitrumApiUrl}${infuraApiKey}`
      }
    default:
      return null
  }
}

/**
 * @function cancelParticipation
 * @param {string} user - The wallet address of the user.
 * @param {string} challengeId - The smart contract challenge ID.
 * @param {BlockchainNetworks} networkName - network name.
 * @param {string} contractAddress - The address of the smart contract.
 * @param {number} cancelType - The type of cancellation to perform.
 * @param {any} abi - The contract ABI to interact with the contract.
 * @returns {Promise<any>} - Returns a Promise that resolves to the transaction receipt or null.
 * This function cancels a user's participation in a smart contract challenge by interacting with the blockchain.
 */
export const cancelParticipation = async (
  user: string,
  challengeId: string,
  networkName: BlockchainNetworks,
  contractAddress: string,
  cancelType: number,
  abi: any,
): Promise<any> => {
  const web3 = await initialize(networkName)
  const contract = new web3.eth.Contract(abi, contractAddress)

  const txData = contract.methods.cancelParticipation(user, challengeId, cancelType).encodeABI()
  const adminAccount = web3.eth.accounts.privateKeyToAccount(scAdminPrivateKey || '')
  const gasEstimate = await contract.methods
    .cancelParticipation(user, challengeId, cancelType)
    .estimateGas({ from: adminAccount.address })

  const gasPrice = await web3.eth.getGasPrice()

  // specify the transaction parameters
  const txParams = {
    from: adminAccount.address,
    to: contractAddress,
    data: txData,
    gasPrice,
    gas: gasEstimate,
  }

  // sign and send the transaction
  return adminAccount
    .signTransaction(txParams)
    .then(async (signedTx) => {
      const receipt: any = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
      const response = await getTransactionHashResponse(
        receipt.transactionHash,
        'CancelParticipation',
        networkName,
        contractAddress,
        abi,
      )
      response.transactionHash = receipt.transactionHash
      logger.info('Challenge Participation Cancelled Successfully')
      return response
    })
    .catch((error) => {
      logger.error('Transaction error in cancel challenge', error)
      return null
    })
}

/**
 * @function checkUserTokenBalance
 * @param {BlockchainNetworks} networkName - name of the network.
 * @param {string} contractAddress - The address of the token contract.
 * @param {any} abi - The contract ABI to interact with the contract.
 * @param {string} walletAddress - The wallet address to check the token balance of.
 * @returns {Promise<string>} - Returns a Promise that resolves to the user's token balance, converted from Wei to Ether.
 * This function retrieves the token balance of a user in Wei and converts it to Ether or the equivalent token units.
 */
export const checkUserTokenBalance = async (
  networkName: BlockchainNetworks,
  contractAddress: string,
  abi: any,
  walletAddress: string,
): Promise<string> => {
  const web3 = await initialize(networkName)
  const contract = new web3.eth.Contract(abi, contractAddress)
  const userBalance = await contract.methods.balanceOf(walletAddress).call()
  const balance = await fromWeiToEther(userBalance, networkName, contractAddress)
  return balance
}

/**
 * @function createMerkleTree
 * @param {string} web3SocketUrl - The URL for the Web3 provider.
 * @param {string} contractAddress - The address of the token contract.
 * @param {any} abi - The contract ABI to interact with the contract.
 * @param {string[]} walletAddresses - The list of wallet addresses to include in the Merkle tree.
 * @returns {Promise<void>} - Returns a Promise that resolves when the Merkle tree has been created and stored.
 * This function creates a Merkle tree from the provided wallet addresses, updates the Merkle root on the blockchain, and saves the tree to a local JSON file.
 */
export const createMerkleTree = async (walletAddresses: string[]): Promise<void> => {
  try {
    let values: any = []
    let treeJson: any

    const filePath = path.join(__dirname, './utils/tree.json')
    logger.info('complete file path : ', filePath)

    if (fs.statSync(filePath).size === 0) {
      logger.info('treeJson when empty : ')
      // get all users wallet address when tree doesn't exist already
      const usersWalletAddresses = await users.findMany({
        select: {
          walletAddress: true,
        },
      })

      const walletAddresses = usersWalletAddresses.map((user) => user.walletAddress)

      await Promise.all(
        walletAddresses.map(async (addr) => {
          const user: any = await users.findUnique({
            where: {
              walletAddress: addr,
            },
            include: {
              referrer: true,
            },
          })

          const membership = [
            user.walletAddress,
            '0',
            '0',
            user.referrer?.walletAddress || ZeroAddress.address,
            user.referrer?.walletAddress ? '1000000000000000000000' : '0',
          ]
          if (membership) {
            values.push([...membership])
          }
        }),
      )
    } else {
      // when tree already exist
      treeJson = fs.readFileSync(filePath)
      treeJson = JSON.parse(treeJson)
      logger.info('treeJson value : ', treeJson?.values)
      values = treeJson?.values?.map((obj: any) => obj.value)
      await Promise.all(
        walletAddresses.map(async (addr) => {
          const walletAddressExist = values?.find((val: string[]) => val[0] === addr)
          if (walletAddressExist !== undefined) {
            const user: any = await users.findUnique({
              where: {
                walletAddress: addr,
              },
              include: {
                referrer: true,
              },
            })

            const membership = [
              user.walletAddress,
              '0',
              '0',
              user.referrer?.walletAddress || ZeroAddress.address,
              user.referrer?.walletAddress ? '1000000000000000000000' : '0',
            ]
            if (membership !== null && membership[1] !== walletAddressExist[1]) {
              values.push([...membership])
            }
          } else {
            const user: any = await users.findUnique({
              where: {
                walletAddress: addr,
              },
              include: {
                referrer: true,
              },
            })

            const membership = [
              user.walletAddress,
              '0',
              '0',
              user.referrer?.walletAddress || ZeroAddress.address,
              user.referrer?.walletAddress ? '1000000000000000000000' : '0',
            ]
            if (membership !== null) values?.push([...membership])
          }
        }),
      )
    }

    // need to create the values array
    const tree = await StandardMerkleTree.of(values, ['address', 'uint256', 'uint256', 'address', 'uint256'])

    logger.info(`Merkle Root: ${tree.root}`)

    const sportContracts = await contracts.findMany({
      where: {
        contractType: ContractType.Sport,
        status: Status.Active,
      },
      select: {
        contractAddress: true,
        abiFile: true,
        networks: {
          select: {
            name: true,
            networkId: true,
          },
        },
      },
    })
    logger.info('sportContracts in createMerkleRoot: ', sportContracts)

    Promise.all(
      sportContracts.map(async (e: any) => {
        try {
          logger.info('calling updateMerkleRoot', tree.root, e?.networks.name, e?.contractAddress, e?.abiFile)
          await updateMerkleRoot(tree.root, e?.networks.name, e?.contractAddress, e?.abiFile)
        } catch (err) {
          logger.error(`Failed to update for contract at ${e?.contractAddress} `, err)
        }
      }),
    )

    fs.writeFileSync(filePath, JSON.stringify(tree.dump()))
    logger.info('Tree JSON updated successfully!')
  } catch (error) {
    logger.error('Error creating merkle tree', error)
  }
}

/**
 * @function fromEtherToWei
 * @param {number} amount - The amount of Ether.
 * @param {number} decimals - The number of decimals for the token.
 * @returns {Promise<string>} - Returns a Promise that resolves to the amount in Wei as a string.
 * Converts an Ether amount to Wei based on the token's decimals.
 */
export const fromEtherToWei = async (amount: number, decimals: number): Promise<string> => {
  const multiplier = BigInt(10) ** BigInt(decimals)
  const amountBigInt = BigInt(amount)
  const convertedAmount = amountBigInt * multiplier

  return convertedAmount.toString()
}

/**
 * @function fromWeiToEther
 * @param {any} amount - The amount in Wei.
 * @param {BlockchainNetworks} networkName - Network name
 * @param {string} tokenAddress - The address of the token contract.
 * @returns {Promise<string>} - Returns a Promise that resolves to the converted amount in Ether as a string.
 * Converts a Wei amount to Ether or equivalent token units based on token decimals.
 */
export const fromWeiToEther = async (
  amount: any,
  networkName: BlockchainNetworks,
  tokenAddress: string,
): Promise<string> => {
  const decimals = await getDecimals(tokenAddress, networkName)
  const divisor = BigInt(10) ** BigInt(decimals)
  const amountBigInt = BigInt(amount)
  const convertedAmount = Number(amountBigInt) / Number(divisor)
  return convertedAmount.toString()
}

/**
 * @function gePastEvents
 * @param {number} blockNumberFrom - The starting block number.
 * @param {number} blockNumberTo - The ending block number.
 * @param {any} eventName - The name of the event to retrieve.
 * @param {BlockchainNetworks} networkName - network name.
 * @param {string} contractAddress - The address of the smart contract.
 * @param {any} abi - The contract ABI to interact with the contract.
 * @returns {Promise<object>} - Returns a Promise resolving to an object containing the past events.
 * Retrieves past events emitted by a smart contract between specific block numbers.
 */
export const gePastEvents = async (
  blockNumberFrom: number,
  blockNumberTo: number,
  eventName: any,
  networkName: BlockchainNetworks,
  contractAddress: string,
  abi: any,
): Promise<object> => {
  const web3 = await initialize(networkName)
  const contract = new web3.eth.Contract(abi, contractAddress)

  const pastEvents: object = await contract.getPastEvents(eventName, {
    fromBlock: blockNumberFrom,
    toBlock: blockNumberTo,
  })
  return pastEvents
}

/**
 * @function generateProof
 * @param {string} walletAddress - The wallet address to generate the proof for.
 * @returns {Promise<string[] | null>} - Returns a Promise that resolves to an array of strings representing the proof or null.
 * Generates a Merkle proof for a given wallet address.
 */
export const generateProof = async (walletAddress: string): Promise<string[] | null> => {
  const filePath = path.join(__dirname, './utils/tree.json')
  logger.info('complete file path : ', filePath)

  if (fs.statSync(filePath).size === 0) {
    logger.debug(`Tree JSON doesn't exist`)
    return null
  }

  const tree = await StandardMerkleTree.load(JSON.parse(fs.readFileSync(filePath, 'utf8')))
  for (const [i, v] of tree.entries()) {
    if (v[0] === walletAddress) {
      const proof = tree.getProof(i)
      logger.info(`Value: ${v}`)
      logger.info(`Proof: ${proof}`)
      return proof
    }
  }

  logger.info('Wallet address not found in merkle tree.')
  return null
}

/**
 * @function getBlockNumber
 * @param {string} txHash - The transaction hash.
 * @param {BlockchainNetworks} networkName - network name.
 * @returns {Promise<bigint | null>} - Returns a Promise resolving to the block number as a bigint or null if not found.
 * Retrieves the block number for a given transaction hash.
 */
export const getBlockNumber = async (txHash: string, networkName: BlockchainNetworks): Promise<bigint | null> => {
  const web3 = await initialize(networkName)
  const receipt: TransactionReceipt = await web3.eth.getTransactionReceipt(txHash)
  if (receipt?.blockNumber) {
    return BigInt(receipt?.blockNumber)
  } else {
    return null
  }
}

/**
 * @function getChallengeDetails
 * @param {string} id - The challenge ID.
 * @param {BlockchainNetworks} networkName - The URL for the Web3 provider.
 * @param {string} contractAddress - The address of the smart contract.
 * @param {any} abi - The contract ABI to interact with the contract.
 * @returns {Promise<object>} - Returns a Promise resolving to an object containing the challenge details.
 * Retrieves the details of a challenge from the blockchain.
 */
export const getChallengeDetails = async (
  id: string,
  networkName: BlockchainNetworks,
  contractAddress: string,
  abi: any,
): Promise<object> => {
  const web3 = await initialize(networkName)
  const contract = new web3.eth.Contract(abi, contractAddress)

  return await contract.methods.getChallengeDetails(id).call()
}

/**
 * @function getCurrentBlockNumber
 * @param {BlockchainNetworks} networkName - The URL for the Web3 provider.
 * @returns {Promise<bigint>} - Returns a Promise resolving to the current block number as a bigint.
 * Retrieves the current block number of the blockchain.
 */
export const getCurrentBlockNumber = async (networkName: BlockchainNetworks): Promise<bigint> => {
  const web3 = await initialize(networkName)
  return await web3.eth.getBlockNumber()
}

/**
 * @function getDecimals
 * @param {string} tokenAddress - The address of the token contract.
 * @param {BlockchainNetworks} networkName - network name.
 * @returns {Promise<number>} - Returns a Promise resolving to the token's number of decimals.
 * This function retrieves the decimal places of a token. If the token is the ZeroAddress, it returns the default decimals for that token.
 */
export const getDecimals = async (tokenAddress: string, networkName: BlockchainNetworks): Promise<number> => {
  if (tokenAddress === ZeroAddress.address) {
    return ZeroAddress.decimals
  }
  const web3 = await initialize(networkName)
  const contract = new web3.eth.Contract(erc20contractAbi, tokenAddress)
  return await contract.methods.decimals().call()
}

/**
 * @function getTokenNameByTokenAddress
 * @param {string} contractAddress - The address of the token contract.
 * @param {number} networkId - The network ID of the blockchain.
 * @returns {Promise<string | null>} - Returns a Promise resolving to the token name or null if the token is not found.
 * This function retrieves the token name based on the token's contract address and network ID.
 */
const getTokenNameByTokenAddress = async (contractAddress: string, networkId: number): Promise<string | null> => {
  const token = await contracts.findFirst({
    where: {
      AND: [
        {
          contractAddress: {
            equals: contractAddress,
            mode: 'insensitive',
          },
        },
        {
          networkId,
        },
      ],
    },
  })
  return token?.tokenName || null
}

/**
 * @function getSubscriber
 *  * @param {BlockchainNetworks} networkName - name of the network.
 * @param {string} contractAddress - The address of the contract.
 * @param {any} abi - The contract ABI to interact with the contract.
 * This function subscribes to all events emitted from the DuelNow token smart contracts and stores the events in the sc_transaction table. If the membership token is missing, it triggers a high-priority alert.
 */
export const getSubscriber = async (
  networkName: BlockchainNetworks,
  contractAddress: string,
  abi: any,
): Promise<any> => {
  const web3 = await initialize(networkName, true)
  const contract = new web3.eth.Contract(abi, contractAddress)

  // subscribe to the smart contract Transfer event
  const subscription = contract.events.allEvents()
  subscription.on('connected', (connected: any) =>
    logger.info(`DuelNow token connected: ${JSON.stringify(connected)}`),
  )

  subscription.on('error', (error: any) =>
    logger.error(`DuelNow token subscription error : ${JSON.stringify(error)}`),
  )
  // return { subscription }
}

/**
 * @function getTransactionHashResponse
 * @param {string} txHash - The transaction hash to retrieve the block number for.
 * @param {string} eventName - The name of the event to retrieve.
 * @param {BlockchainNetworks} networkName - network name.
 * @param {string} contractAddress - The address of the contract.
 * @param {any} abi - The contract ABI to interact with the contract.
 * @returns {Promise<any>} - Returns a Promise that resolves to the blockchain event related to the transaction.
 * This function retrieves a transaction event by its hash and returns the details of the specified event.
 */
export const getTransactionHashResponse = async (
  txHash: string,
  eventName: string,
  networkName: BlockchainNetworks,
  contractAddress: string,
  abi: any,
): Promise<any> => {
  const blockNumber: bigint | null = await getBlockNumber(txHash, networkName)
  if (!blockNumber) return null
  const response: any = await gePastEvents(
    Number(blockNumber),
    Number(blockNumber),
    eventName,
    networkName,
    contractAddress,
    abi,
  )
  return response
}

/**
 * @function resolveChallenge
 * @param {number[]} challengeIds - The list of challenge IDs.
 * @param {number[]} finalOutcomes - The list of outcomes for the challenges.
 * @param {BlockchainNetworks} networkName - name of the network.
 * @param {string} contractAddress - The address of the contract.
 * @param {number} internalChallengeId - The internal ID of the challenge.
 * @param {string} tokenAddress - The address of the token contract.
 * @param {any} abi - The contract ABI to interact with the contract.
 * @returns {Promise<ChallengeFundsMoved[] | null>} - Returns a Promise resolving to the list of ChallengeFundsMoved objects or null if the resolution fails.
 * This function resolves a set of challenges on the blockchain by interacting with the smart contract and returns the winners, losers, and their respective profits/losses.
 */
export const resolveChallenge = async (
  challengeIds: number[],
  finalOutcomes: number[],
  networkName: BlockchainNetworks,
  contractAddress: string,
  internalChallengeId: number,
  tokenAddress: string,
  abi: any,
): Promise<ChallengeFundsMoved[] | null> => {
  try {
    console.log('--------line 4----------')
    logger.debug(
      `resolveChallenge request received for scChallengeIds: ${challengeIds}, finalOutcomes: ${finalOutcomes}, networkName: ${networkName}, contractAddress: ${contractAddress}, internalChallengeId: ${internalChallengeId}`,
    )
    const web3 = await initialize(networkName)
    const contract = new web3.eth.Contract(abi, contractAddress)
    const adminAccount = web3.eth.accounts.privateKeyToAccount(scAdminPrivateKey || '')
    console.log('--------line 6----------')

    const challengeData: any = await getChallengeDetails(`${challengeIds[0]}`, networkName, contractAddress, abi)
    const { status } = challengeData
    const contractData: any = await contracts.findFirst({
      where: {
        contractAddress: tokenAddress,
        networks: {
          name: networkName,
        },
      },
      include: {
        networks: true,
      },
    })
    logger.info(`resolveChallenge: contractData - ${JSON.stringify(contractData)}`)
    logger.info(`resolveChallenge: status - ${status}`)
    if (
      Number(status) === SCChallengeStatus.ResolvedAgainst ||
      Number(status) === SCChallengeStatus.ResolvedFor ||
      Number(status) === SCChallengeStatus.ResolvedDraw
    ) {
      const challengeExist = await challenges.findFirst({
        where: {
          challengeId: internalChallengeId,
          scChallengeId: `${challengeIds[0]}`,
        },
      })

      logger.info(`resolveChallenge: challenge exist: ${challengeExist} `)

      const eventExist: any = await scTransactions.findFirst({
        where: {
          AND: [
            {
              rawData: {
                path: ['challengeId'],
                equals: Number(challengeIds[0]),
              },
            },
            {
              rawData: {
                path: ['method'],
                equals: 'ChallengeFundsMoved',
              },
            },
          ],
          contractId: Number(challengeExist?.contractId),
        },
      })
      logger.info(`ChallengeResolved: event: ${JSON.stringify(eventExist)}`)

      if (eventExist) {
        return [
          {
            challengeId: Number(eventExist.rawData?.challengeId),
            winners: eventExist.rawData?.winners || [],
            winnersProfit:
              (await Promise.all(
                eventExist.rawData?.winnersProfit?.map(
                  async (profit: Record<string, number>) => profit?.originalStakedQty,
                ),
              )) || [],
            winnersProfitInUSD:
              (await Promise.all(
                eventExist.rawData?.winnersProfit?.map(async (profit: Record<string, number>) => profit?.valueInUSD),
              )) || [],
            losers: eventExist.rawData?.losers || [],
            losersLoss:
              (await Promise.all(
                eventExist.rawData?.losersLoss?.map(async (loss: Record<string, number>) => loss?.originalStakedQty),
              )) || [],
            losersLossInUSD:
              (await Promise.all(
                eventExist.rawData?.losersLoss?.map(async (loss: Record<string, number>) => loss?.valueInUSD),
              )) || [],
          },
        ]
      }

      const txHash: string | null = await getRedisKey(`ChallengeResolved:${internalChallengeId}:txHash`)
      if (!txHash) {
        throw new Error(
          `ChallengeResolved: Tx Hash is not present in redis against internalChallengeId: ${internalChallengeId} for further processing.`,
        )
      }
      const pastEvents = await getTransactionHashResponse(
        txHash,
        'ChallengeFundsMoved',
        networkName,
        contractAddress,
        abi,
      )

      logger.info(`Got the past events when tx hash exist, txHash :${txHash}, pastEvents: ${pastEvents} `)

      const challengeFundMoved: ChallengeFundsMoved[] = await Promise.all(
        pastEvents.map(async ({ returnValues }: any) => {
          const tokenName: string | null = await getTokenNameByTokenAddress(tokenAddress, contractData?.networkId)
          if (!tokenName) {
            throw new Error(`ChallengeResolved: tokenName is invalid: ${tokenName}`)
          }
          const rate: PriceResult[] = await getRates([tokenName])
          const usdPrice = rate[0]?.usdPrice ?? 0
          return {
            challengeId: Number(returnValues?.challengeId),
            winners: returnValues?.winners || [],
            winnersProfit:
              (await Promise.all(
                returnValues?.winnersProfit?.map(async (profit: bigint) =>
                  Number(await fromWeiToEther(profit.toString(), networkName, tokenAddress)),
                ),
              )) || [],
            winnersProfitInUSD:
              (await Promise.all(
                returnValues?.winnersProfit?.map(
                  async (profit: bigint) =>
                    usdPrice * Number(await fromWeiToEther(profit.toString(), networkName, tokenAddress)),
                ),
              )) || [],
            losers: returnValues?.losers || [],
            losersLoss:
              (await Promise.all(
                returnValues?.losersLoss?.map(
                  async (loss: bigint) => -1 * Number(await fromWeiToEther(loss.toString(), networkName, tokenAddress)),
                ),
              )) || [],
            losersLossInUSD:
              (await Promise.all(
                returnValues?.losersLoss?.map(
                  async (loss: bigint) =>
                    -1 * Number(await fromWeiToEther(loss.toString(), networkName, tokenAddress)) * usdPrice,
                ),
              )) || [],
          }
        }),
      )
      return challengeFundMoved
    }

    const txData = contract.methods.resolveChallenge(challengeIds, finalOutcomes).encodeABI()
    console.log('--------line 7----------')
    const gasEstimate = await contract.methods
      .resolveChallenge(challengeIds, finalOutcomes)
      .estimateGas({ from: adminAccount.address })
    console.log('--------line 8----------')

    const gasPrice = await web3.eth.getGasPrice()
    console.log('--------line 9----------')
    // specify the transaction parameters
    const txParams = {
      from: adminAccount.address,
      to: contractAddress,
      data: txData,
      gasPrice,
      gas: gasEstimate,
    }

    // sign and send the transaction
    return adminAccount
      .signTransaction(txParams)
      .then(async (signedTx) => {
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        const txHash = receipt.transactionHash.toString()

        logger.info(`ChallengeResolved: Got txhash: ${txHash} against challengeIds: ${internalChallengeId}`)

        await setRedisKey(`ChallengeResolved:${internalChallengeId}:txHash`, txHash, 3600)

        const pastEvents = await getTransactionHashResponse(
          txHash,
          'ChallengeFundsMoved',
          networkName,
          contractAddress,
          abi,
        )

        logger.info(`resolveChallenge: pastEvents when challenge is not resolved: ${[pastEvents]} `)

        const resolveResponse = await Promise.all(
          pastEvents.map(async ({ returnValues }: any) => {
            const tokenName: string | null = await getTokenNameByTokenAddress(tokenAddress, contractData?.networkId)
            if (!tokenName) {
              throw new Error(`ChallengeResolved: tokenName is invalid: ${tokenName}`)
            }

            const rate: PriceResult[] = await getRates([tokenName])

            const usdPrice = rate[0]?.usdPrice ?? 0
            return {
              challengeId: Number(returnValues?.challengeId),
              winners: returnValues?.winners || [],
              winnersProfit:
                (await Promise.all(
                  returnValues?.winnersProfit?.map(async (profit: bigint) =>
                    Number(await fromWeiToEther(profit.toString(), networkName, tokenAddress)),
                  ),
                )) || [],
              winnersProfitInUSD:
                (await Promise.all(
                  returnValues?.winnersProfit?.map(
                    async (profit: bigint) =>
                      usdPrice * Number(await fromWeiToEther(profit.toString(), networkName, tokenAddress)),
                  ),
                )) || [],
              losers: returnValues?.losers || [],
              losersLoss:
                (await Promise.all(
                  returnValues?.losersLoss?.map(
                    async (loss: bigint) =>
                      -1 * Number(await fromWeiToEther(loss.toString(), networkName, tokenAddress)),
                  ),
                )) || [],
              losersLossInUSD:
                (await Promise.all(
                  returnValues?.losersLoss?.map(
                    async (loss: bigint) =>
                      -1 * Number(await fromWeiToEther(loss.toString(), networkName, tokenAddress)) * usdPrice,
                  ),
                )) || [],
            }
          }),
        )
        logger.info('Challenge Resolved Successfully')
        return resolveResponse
      })
      .catch((error) => {
        logger.error('Transaction error in challenge resolution catch: ', error)
        logger.error(
          `resolveChallenge request error for scChallengeId: ${challengeIds}, finalOutcomes: ${finalOutcomes}, networkName: ${networkName}, contractAddress: ${contractAddress}, internalChallengeId: ${internalChallengeId} `,
        )
        return null
      })
  } catch (error) {
    logger.error('Transaction error in challenge resolution general catch: ', error)
    logger.error(
      `resolveChallenge request error for scChallengeId: ${challengeIds}, finalOutcomes: ${finalOutcomes}, networkName: ${networkName}, contractAddress: ${contractAddress}, internalChallengeId: ${internalChallengeId} `,
    )
    return null
  }
}

/**
 * @function resolveGroupChallenge
 * @param {number} challengeId - The ID of the group challenge.
 * @param {string[]} winners - The list of wallet addresses of the winners.
 * @param {number[]} profits - The list of profits corresponding to the winners.
 * @param {BlockchainNetworks} networkName - name of the network.
 * @param {string} contractAddress - The address of the contract.
 * @param {number} internalChallengeId - The internal ID of the challenge.
 * @param {string} tokenAddress - The address of the token contract.
 * @param {any} abi - The contract ABI to interact with the contract.
 * @returns {Promise<ChallengeFundsMoved[] | null>} - Returns a Promise resolving to the list of ChallengeFundsMoved objects or null if the resolution fails.
 * This function resolves a group challenge on the blockchain by interacting with the smart contract and returns the winners, losers, and their respective profits/losses.
 */
export const resolveGroupChallenge = async (
  challengeId: number,
  winners: string[],
  profits: number[],
  networkName: BlockchainNetworks,
  contractAddress: string,
  internalChallengeId: number,
  tokenAddress: string,
  abi: any,
): Promise<ChallengeFundsMoved[] | null> => {
  try {
    console.log('--------pickem 6----------')
    logger.debug(
      `resolveGroupChallenge request received for scChallengeId: ${challengeId}, winners: ${winners}, profits: ${profits}, networkName: ${networkName}, contractAddress: ${contractAddress}, internalChallengeId: ${internalChallengeId}, tokenAddress: ${tokenAddress} `,
    )
    const web3 = await initialize(networkName)
    const contract = new web3.eth.Contract(abi, contractAddress)
    const adminAccount = web3.eth.accounts.privateKeyToAccount(scAdminPrivateKey || '')
    console.log('--------pickem 7----------')
    const profitsUpdated = await Promise.all(profits.map(async (profit: number) => await fromEtherToWei(profit, 18)))
    winners.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

    const challengeData: any = await getChallengeDetails(`${challengeId}`, networkName, contractAddress, abi)
    const { status } = challengeData

    const contractData: any = await contracts.findFirst({
      where: {
        contractAddress: tokenAddress,
        networks: {
          name: networkName,
        },
      },
      include: {
        networks: true,
      },
    })

    logger.info(`resolveGroupChallenge: contractData - ${JSON.stringify(contractData)}`)
    logger.info(`resolveGroupChallenge: status - ${status}`)

    if (
      Number(status) === SCChallengeStatus.ResolvedAgainst ||
      Number(status) === SCChallengeStatus.ResolvedFor ||
      Number(status) === SCChallengeStatus.ResolvedDraw
    ) {
      const challengeExist = await challenges.findFirst({
        where: {
          challengeId: internalChallengeId,
          scChallengeId: `${challengeId}`,
        },
      })

      logger.info(`resolveGroupChallenge: challenge exist: ${challengeExist}`)

      const eventExist: any = await scTransactions.findFirst({
        where: {
          AND: [
            {
              rawData: {
                path: ['challengeId'],
                equals: Number(challengeId),
              },
            },
            {
              rawData: {
                path: ['method'],
                equals: 'ChallengeFundsMoved',
              },
            },
          ],
          contractId: Number(challengeExist?.contractId),
        },
      })

      logger.info(`ResolveGroupChallenge: event: ${JSON.stringify(eventExist)}`)

      if (eventExist) {
        return [
          {
            challengeId: Number(eventExist.rawData?.challengeId),
            winners: eventExist.rawData?.winners || [],
            winnersProfit:
              (await Promise.all(
                eventExist.rawData?.winnersProfit.map(
                  async (profit: Record<string, number>) => profit?.originalStakedQty,
                ),
              )) || [],
            winnersProfitInUSD:
              (await Promise.all(
                eventExist.rawData?.winnersProfit.map(async (profit: Record<string, number>) => profit?.valueInUSD),
              )) || [],
            losers: eventExist.rawData?.losers || [],
            losersLoss:
              (await Promise.all(
                eventExist.rawData?.losersLoss.map(async (loss: Record<string, number>) => loss?.originalStakedQty),
              )) || [],
            losersLossInUSD:
              (await Promise.all(
                eventExist.rawData?.losersLoss.map(async (loss: Record<string, number>) => loss?.valueInUSD),
              )) || [],
          },
        ]
      }

      const txHash: string | null = await getRedisKey(`ResolveGroupChallenge:${internalChallengeId}:txHash`)
      if (!txHash) {
        throw new Error(
          `ResolveGroupChallenge: Tx Hash is not present in redis against internalChallengeId: ${internalChallengeId} for further processing.`,
        )
      }
      const pastEvents = await getTransactionHashResponse(
        txHash,
        'ChallengeFundsMoved',
        networkName,
        contractAddress,
        abi,
      )

      logger.info(
        `resolveGroupChallenge: Got the past events when tx hash exist, txHash :  ${txHash}, pastEvents: ${pastEvents} `,
      )

      const challengeFundMoved: ChallengeFundsMoved[] = await Promise.all(
        pastEvents.map(async ({ returnValues }: any) => {
          const tokenName: string | null = await getTokenNameByTokenAddress(tokenAddress, contractData?.networkId)
          if (!tokenName) {
            throw new Error(`GroupChallengeResolved: tokenName is invalid: ${tokenName}`)
          }
          const rate: PriceResult[] = await getRates([tokenName])
          const usdPrice = rate[0]?.usdPrice ?? 0

          return {
            challengeId: Number(returnValues?.challengeId),
            winners: returnValues?.winners || [],
            winnersProfit:
              (await Promise.all(
                returnValues?.winnersProfit?.map(async (profit: bigint) =>
                  Number(await fromWeiToEther(profit.toString(), networkName, tokenAddress)),
                ),
              )) || [],
            winnersProfitInUSD:
              (await Promise.all(
                returnValues?.winnersProfit?.map(
                  async (profit: bigint) =>
                    usdPrice * Number(await fromWeiToEther(profit.toString(), networkName, tokenAddress)),
                ),
              )) || [],
            losers: returnValues?.losers || [],
            losersLoss:
              (await Promise.all(
                returnValues?.losersLoss?.map(
                  async (loss: bigint) => -1 * Number(await fromWeiToEther(loss.toString(), networkName, tokenAddress)),
                ),
              )) || [],
            losersLossInUSD:
              (await Promise.all(
                returnValues?.losersLoss?.map(
                  async (loss: bigint) =>
                    -1 * Number(await fromWeiToEther(loss.toString(), networkName, tokenAddress)) * usdPrice,
                ),
              )) || [],
          }
        }),
      )
      return challengeFundMoved
    }

    const txData = contract.methods.resolveGroupChallenge(challengeId, winners, profitsUpdated).encodeABI()
    const gasEstimate = await contract.methods
      .resolveGroupChallenge(challengeId, winners, profitsUpdated)
      .estimateGas({ from: adminAccount.address })
    console.log('--------pickem 8----------')

    const gasPrice = await web3.eth.getGasPrice()

    // specify the transaction parameters
    const txParams = {
      from: adminAccount.address,
      to: contractAddress,
      data: txData,
      gasPrice,
      gas: gasEstimate,
    }
    console.log('--------pickem 9----------')
    // sign and send the transaction
    return adminAccount
      .signTransaction(txParams)
      .then(async (signedTx) => {
        console.log('--------pickem 10----------')
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        const txHash = receipt.transactionHash.toString()

        logger.info(`ResolveGroupChallenge: Got txhash: ${txHash} against challengeIds: ${internalChallengeId} `)

        await setRedisKey(`ResolveGroupChallenge:${internalChallengeId}:txHash`, txHash, 3600)

        const pastEvents = await getTransactionHashResponse(
          txHash,
          'ChallengeFundsMoved',
          networkName,
          contractAddress,
          abi,
        )

        logger.info(`resolveGroupChallenge: pastEvents when challenge is not resolved: ${[pastEvents]} `)

        const resolveResponse = await Promise.all(
          pastEvents.map(async ({ returnValues }: any) => {
            const tokenName: string | null = await getTokenNameByTokenAddress(tokenAddress, contractData?.networkId)
            if (!tokenName) {
              throw new Error(`ChallengeResolved: tokenName is invalid: ${tokenName}`)
            }
            const rate: PriceResult[] = await getRates([tokenName])
            const usdPrice = rate[0]?.usdPrice ?? 0

            return {
              challengeId: Number(returnValues?.challengeId),
              winners: returnValues?.winners || [],
              winnersProfit:
                (await Promise.all(
                  returnValues?.winnersProfit?.map(async (profit: bigint) =>
                    Number(await fromWeiToEther(profit.toString(), networkName, tokenAddress)),
                  ),
                )) || [],
              winnersProfitInUSD:
                (await Promise.all(
                  returnValues?.winnersProfit?.map(
                    async (profit: bigint) =>
                      usdPrice * Number(await fromWeiToEther(profit.toString(), networkName, tokenAddress)),
                  ),
                )) || [],
              losers: returnValues?.losers,
              losersLoss:
                (await Promise.all(
                  returnValues?.losersLoss?.map(
                    async (loss: bigint) =>
                      -1 * Number(await fromWeiToEther(loss.toString(), networkName, tokenAddress)),
                  ),
                )) || [],
              losersLossInUSD: await Promise.all(
                returnValues?.losersLoss?.map(
                  async (loss: bigint) =>
                    -1 * Number(await fromWeiToEther(loss.toString(), networkName, tokenAddress)) * usdPrice,
                ),
              ),
            }
          }),
        )
        logger.info('Challenge Resolved Successfully')
        return resolveResponse
      })
      .catch((error) => {
        logger.error('Transaction error in group challenge resolution catch: ', error)
        logger.error(
          `resolveGroupChallenge request error for scChallengeId: ${challengeId}, winners: ${winners}, profits: ${profits}, networkName: ${networkName}, contractAddress: ${contractAddress}, internalChallengeId: ${internalChallengeId} `,
        )
        return null
      })
  } catch (error) {
    logger.error('Transaction error in group challenge resolution general catch: ', error)
    logger.error(
      `resolveGroupChallenge request error for scChallengeId: ${challengeId}, winners: ${winners}, profits: ${profits}, networkName: ${networkName}, contractAddress: ${contractAddress}, internalChallengeId: ${internalChallengeId} `,
    )
    return null
  }
}

/**
 * @function updateMerkleRoot
 * @param {string} root - The new Merkle root to update.
 * @param {BlockchainNetworks} networkName - name of the network.
 * @param {string} contractAddress - The address of the contract.
 * @param {any} abi - The contract ABI to interact with the contract.
 * @returns {Promise<string | null>} - Returns a Promise resolving to the transaction hash or null if the update fails.
 * This function updates the Merkle tree root on the blockchain and logs the transaction hash upon success.
 */
export const updateMerkleRoot = async (
  root: string,
  networkName: BlockchainNetworks,
  contractAddress: string,
  abi: any,
): Promise<string | null> => {
  try {
    logger.info('root: ', root)
    logger.info('networkName: ', networkName)
    logger.info('contractAddress: ', contractAddress)
    logger.info('abi: ', abi)

    const web3 = await initialize(networkName)
    const contract = new web3.eth.Contract(abi, contractAddress)

    const txData = contract.methods.updateRoot(root).encodeABI()
    const adminAccount = web3.eth.accounts.privateKeyToAccount(scAdminPrivateKey || '')
    const gasEstimate = await contract.methods.updateRoot(root).estimateGas({ from: adminAccount.address })

    const gasPrice = await web3.eth.getGasPrice()

    const txParams = {
      from: adminAccount.address,
      to: contractAddress,
      data: txData,
      gasPrice,
      gas: gasEstimate,
    }
    logger.info('txParams: ', txParams)
    return adminAccount
      .signTransaction(txParams)
      .then(async (signedTx) => {
        const receipt: any = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        logger.info('Merkle root updated Successfully')
        return receipt.transactionHash
      })
      .catch((error) => {
        logger.error('Transaction error in merkle tree update', error)
        return null
      })
  } catch (err) {
    logger.debug('updateMerkleRoot error: ', err)
    return null
  }
}
