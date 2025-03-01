export interface ChallengeCanceled {
  challengeId: number
}

export interface ChallengeCreatedOrJoined {
  by: string
  challengeId: number
  token: string
}

export interface ChallengeFundsMoved {
  challengeId: number
  losers: string[]
  losersLoss: number[]
  losersLossInUSD: number[]
  winners: string[]
  winnersProfit: number[]
  winnersProfitInUSD: number[]
  transactionHash?: string
}

export interface ChallengeJoined {
  amount: number
  by: string
  challengeId: number
}

type erc20AbiTypes = readonly [
  {
    inputs: []
    name: 'decimals'
    outputs: [{ internalType: 'uint8'; name: ''; type: 'uint8' }]
    stateMutability: 'view'
    type: 'function'
  },
  {
    inputs: []
    name: 'symbol'
    outputs: [{ internalType: 'string'; name: ''; type: 'string' }]
    stateMutability: 'view'
    type: 'function'
  },
  {
    inputs: []
    name: 'totalSupply'
    outputs: [{ internalType: 'uint256'; name: ''; type: 'uint256' }]
    stateMutability: 'view'
    type: 'function'
  },
]

export type { erc20AbiTypes }
