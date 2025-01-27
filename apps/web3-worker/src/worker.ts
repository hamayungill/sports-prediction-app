import { BlockchainNetworks } from '@duelnow/database'
import { AlertPriority, ContractType } from '@duelnow/utils'
import { getSubscriber } from '@duelnow/web3'

import { fetchContract } from './service/database'
import { logger, processMembershipTokenEvent, sendAlertTrigger } from './utils'

export async function startWorker(): Promise<void> {
  try {
    subscribe()
  } catch (error) {
    logger.error(error)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subscriber = async (contractType: ContractType, network: BlockchainNetworks): Promise<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contract: any = await fetchContract(contractType, network)
  if (contract) {
    const { abiFile, contractAddress } = contract
    const { subscription } = await getSubscriber(network, contractAddress, abiFile)
    return { subscription, contract }
  } else {
    const message = `High: Web3 subscriber not started for contractType: ${contractType} and network: ${network}`
    const error = `contractType: ${contractType} for network: ${network} doesn't exist in database`
    await sendAlertTrigger(message, error, AlertPriority.High)
  }
}

/**
 * The subscribe method subscribes to all the events emitted from the DuelNow Token Smart Contracts, and the data is stored in the
 *  sc_transaction table. Also, on getting the Transfer event, we trigger the membership level update and the merkle tree.
 */
export const subscribe = async (): Promise<void> => {
  const { subscription: tokenSubscriber, contract } = await subscriber(
    ContractType.DuelNowToken,
    BlockchainNetworks.Ethereum,
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenSubscriber.on('connected', (connected: any) =>
    logger.info(`DuelNow token connected: ${JSON.stringify(connected)}`),
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenSubscriber.on('data', async (data: any) => {
    await processMembershipTokenEvent(data, contract)
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenSubscriber.on('error', async (error: any) => {
    const message = `Moderate: Web3 subscriber error for contractType: ${ContractType.DuelNowToken} contract and network: ${BlockchainNetworks.Ethereum}.`
    const errorMessage = `Error details: ${JSON.stringify(error)}`

    await sendAlertTrigger(message, errorMessage, AlertPriority.Moderate)
  })
}
