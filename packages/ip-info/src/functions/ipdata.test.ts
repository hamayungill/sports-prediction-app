import { getBulkIpInfo, getIpInfo } from './ipdata'

jest.mock('ipdata', (): object => {
  return jest.fn().mockImplementation(() => ({
    lookup: (ip: string): object => {
      return { ip }
    },
    bulkLookup: (ips: string[]): Array<object> => {
      return ips.map((ip) => ({ ip }))
    },
  }))
})

describe('Test cases for the ipdata file', () => {
  it('should send ips info when getBulkIpInfo function is called', async () => {
    const resp = await getBulkIpInfo(['192.68.0.0', '192.168.1.0'])
    expect(resp).toStrictEqual([{ ip: '192.68.0.0' }, { ip: '192.168.1.0' }])
  })

  it('should throw error when ips are not passed to getBulkIpInfo function', async () => {
    await getBulkIpInfo([]).catch((err) => {
      expect(err).toStrictEqual(Error('Invalid IPs.'))
    })
  })

  it('should send ip info when getIpInfo function is called', async () => {
    const resp = await getIpInfo('192.68.0.0')
    expect(resp).toStrictEqual({ ip: '192.68.0.0' })
  })

  it('should send ip info when getIpInfo function is called with ipv6', async () => {
    const resp = await getIpInfo('2406:7400:104:dcfe:1d14:b4af:4d75:6125')
    expect(resp).toStrictEqual({ ip: '2406:7400:104:dcfe:1d14:b4af:4d75:6125' })
  })

  it('should throw error when invalid ip is passed to getIpInfo function', async () => {
    await getIpInfo('123').catch((err) => {
      expect(err).toStrictEqual(Error('Invalid IP.'))
    })
  })

  it('should throw error when ip is not passed to getIpInfo function', async () => {
    await getIpInfo('').catch((err) => {
      expect(err).toStrictEqual(Error('Invalid IP.'))
    })
  })
})
