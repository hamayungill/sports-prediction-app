const { NODE_ENV, INFURA_API_KEY } = process.env

enum BlockchainNetworks {
  Ethereum = 'Ethereum',
  Arbitrum = 'Arbitrum',
}

export { BlockchainNetworks, INFURA_API_KEY, NODE_ENV }
