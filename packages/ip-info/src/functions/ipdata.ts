import IPData, { LookupResponse } from 'ipdata'

// eslint-disable-next-line turbo/no-undeclared-env-vars
const { CACHE_MAX_AGE, CACHE_MAX_SIZE, IPDATA_API_KEY } = process.env

const cacheConfig = {
  max: Number(CACHE_MAX_SIZE), // max size
  maxAge: Number(CACHE_MAX_AGE), // max age in ms
}

// @ts-expect-error As envs are added to defaults there won't be issue with type
const ipdata = new IPData(IPDATA_API_KEY, cacheConfig)

const getIpInfo = async (ip: string): Promise<LookupResponse> => {
  if (!ip || !isValidIp(ip)) throw new Error('Invalid IP.')
  const ipInfo: LookupResponse = await ipdata.lookup(ip)
  return ipInfo
}
const getBulkIpInfo = async (ips: string[]): Promise<LookupResponse[]> => {
  if (!ips || !ips.length) throw new Error('Invalid IPs.')
  const ipInfo: LookupResponse[] = await ipdata.bulkLookup(ips)
  return ipInfo
}
export { getBulkIpInfo, getIpInfo, ipdata }

const isValidIp = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i
  if (ipv4Regex.test(ip)) {
    return ip.split('.').every((part) => parseInt(part) <= 255)
  }
  if (ipv6Regex.test(ip)) {
    return ip.split(':').every((part) => part.length <= 4)
  }
  return false
}
