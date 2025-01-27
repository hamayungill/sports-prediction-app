import axios from '@duelnow/axios-extended'

import { SPORTS_API_URL } from '../utils/const'

const sports = axios(`${SPORTS_API_URL}/v1`)

export default sports
