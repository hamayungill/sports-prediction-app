const { COINGECKO_API_URL, COINGECKO_API_KEY } = process.env

export { COINGECKO_API_KEY, COINGECKO_API_URL }

export const Tokens: Record<string, string> = {
  stmx: 'storm',
  usdt: 'tether',
  usdc: 'usd-coin',
  eth: 'ethereum',
  arb: 'arbitrum',
}
