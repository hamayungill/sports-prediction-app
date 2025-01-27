import axios from '@duelnow/axios-extended'

import { CUSTOMERIO } from './consts'

const customerioBroadcast = axios(CUSTOMERIO.api.broadcastUrl as string)
customerioBroadcast.defaults.headers.post['Authorization'] = `Bearer ${CUSTOMERIO.api.appKey}`

export default customerioBroadcast
