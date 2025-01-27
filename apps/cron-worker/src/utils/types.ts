interface ChallengeFundsMoved {
  challengeId: number
  losers: string[]
  losersLoss: number[]
  losersLossInUSD: number[]
  winners: string[]
  winnersProfit: number[]
  winnersProfitInUSD: number[]
}

export type { ChallengeFundsMoved }
