import axios from '@duelnow/axios-extended'

import { ACCOUNT_API_URL } from '../utils/const'

const account = axios(`${ACCOUNT_API_URL}/v1`)

export default account
