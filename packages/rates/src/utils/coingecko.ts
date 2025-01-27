import axios from '@duelnow/axios-extended'

import { COINGECKO_API_KEY, COINGECKO_API_URL } from './const'

const coingecko = axios(COINGECKO_API_URL as string, { 'x-cg-demo-api-key': COINGECKO_API_KEY })

export default coingecko
