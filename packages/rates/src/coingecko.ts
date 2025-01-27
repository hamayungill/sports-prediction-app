import { getRedisKey, setRedisKey } from '@duelnow/redis'
import { PriceResult } from '@duelnow/utils'

import coingecko from './utils/coingecko'
import { Tokens } from './utils/const'
import { logger } from './utils/logger'

export const getRates = async (tokens: string[]): Promise<PriceResult[]> => {
  try {
    const tokensUsdPrice = []
    const notFoundTokenIdsInRedis = []
    const notFoundTokenNamesInRedis = []

    for (const tokenSymbol of tokens) {
      let token = tokenSymbol.toLowerCase()
      const tokenShortName = token
      token = Tokens[token] ? Tokens[token] : token
      const usdPrice = await getRedisKey(`token:${tokenShortName}:cg:rate`)
      if (usdPrice) {
        tokensUsdPrice.push({
          token: tokenShortName,
          usdPrice: Number(usdPrice),
        })
      } else {
        notFoundTokenIdsInRedis.push(token)
        notFoundTokenNamesInRedis.push(tokenShortName)
      }
    }

    if (notFoundTokenIdsInRedis.length > 0) {
      const tokensIds = notFoundTokenIdsInRedis.join(',')
      const { data } = await coingecko.get(`simple/price?ids=${tokensIds}&vs_currencies=usd`)
      for (const [index, value] of notFoundTokenNamesInRedis.entries()) {
        const usdPrice = data[notFoundTokenIdsInRedis[index]]?.usd
        await setRedisKey(`token:${value}:cg:rate`, `${usdPrice}`, 300)
        tokensUsdPrice.push({
          token: value,
          usdPrice: Number(usdPrice),
        })
      }
    }

    return tokensUsdPrice
  } catch (e) {
    logger.error('coingecko API error')
    return []
  }
}
