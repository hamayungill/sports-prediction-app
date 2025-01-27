import axios from '@duelnow/axios-extended'

import { CUSTOMERIO } from './consts'

const customerio = axios(CUSTOMERIO.api.url as string)
const encoded = Buffer.from(CUSTOMERIO.api.siteId + ':' + CUSTOMERIO.api.key).toString('base64')
customerio.defaults.headers.post['Authorization'] = `Basic ${encoded}`

export default customerio
