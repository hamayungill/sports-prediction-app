import { BlockchainEvents } from '@duelnow/utils'
import { checkUserTokenBalance, createMerkleTree } from '@duelnow/web3'

import { createScTransactions } from '../service/database'

import { checkMembership, logger } from './index'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const processMembershipTokenEvent = async (data: any, contract: any): Promise<void> => {
  const {
    networks: { networkId, name: networkName },
    abiFile: abi,
    contractAddress,
    contractId,
  } = contract
  const { returnValues, event, transactionHash, blockNumber: blockNum } = data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData: any = {
    ...returnValues,
    method: event,
    transactionHash,
    blockNum,
    networkId,
  }

  await createScTransactions(contractId, rawData)

  if (event === BlockchainEvents.Transfer) {
    const { from: senderAddress, to: receiverAddress } = returnValues
    logger.debug(`Sender: ${senderAddress}`)
    logger.debug(`Receiver: ${receiverAddress}`)

    const senderBalance = await checkUserTokenBalance(networkName, contractAddress, abi, `${senderAddress}`)
    await checkMembership(senderBalance, senderAddress)

    const receiverBalance = await checkUserTokenBalance(networkName, contractAddress, abi, `${receiverAddress}`)
    await checkMembership(receiverBalance, receiverAddress)

    await createMerkleTree([`${senderAddress}`, `${receiverAddress}`])
  }
}
