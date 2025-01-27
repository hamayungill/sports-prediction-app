import query from './query'

describe('Tests for parseFilter function', () => {
  it('should correctly parse a filter string with single conditions', () => {
    const filter = 'category:eq:task,status:in:[1,2],date:lt:2022-10-11,name:has:har'
    const mockResponse = {
      category: [{ op: 'eq', value: 'task' }],
      status: [{ op: 'in', value: '[1,2]' }],
      date: [{ op: 'lt', value: '2022-10-11' }],
      name: [{ op: 'has', value: 'har' }],
    }
    expect(query.parseFilter({ filter })).toEqual(mockResponse)
  })

  it('should correctly parse a filter string with multiple date conditions', () => {
    const filter = 'category:eq:task,status:in:[1,2],date:gt:2022-10-11,date:lt:2022-11-11,name:has:har'
    const mockResponse = {
      category: [{ op: 'eq', value: 'task' }],
      status: [{ op: 'in', value: '[1,2]' }],
      date: [
        { op: 'gt', value: '2022-10-11' },
        { op: 'lt', value: '2022-11-11' },
      ],
      name: [{ op: 'has', value: 'har' }],
    }
    expect(query.parseFilter({ filter })).toEqual(mockResponse)
  })

  it('should correctly parse the filter string with whitelist', () => {
    const filter = 'category:eq:task,status:in:[1,2],date:lt:2022-10-11,name:has:har'
    const whitelist: [string, string][] = [['category', 'eq']]
    const mockResponse = {
      category: [{ op: 'eq', value: 'task' }],
    }
    expect(query.parseFilter({ filter, whitelist })).toEqual(mockResponse)
  })

  it('should correctly parse the filter string with whitelistProps', () => {
    const filter = 'category:eq:task,status:in:[1,2],date:lt:2022-10-11,name:has:har'
    const whitelistProps: [string] = ['status']
    const mockResponse = { status: [{ op: 'in', value: '[1,2]' }] }
    expect(query.parseFilter({ filter, whitelistProps })).toEqual(mockResponse)
  })

  it('should correctly handle empty input', () => {
    const mockResponse = {}
    expect(query.parseFilter({})).toEqual(mockResponse)
  })
})

describe('Tests for getDbQuery function', () => {
  it('should return empty object when filter is empty', () => {
    const filter = ''
    const whitelistProps: [string] = ['status']
    const mockResponse = {}
    expect(query.getDbQuery({ filter, whitelistProps })).toEqual(mockResponse)
  })

  it('should correctly generate the prisma query with filter', () => {
    const filter = 'category:eq:task,status:in:[1,2],date:lt:2022-10-11,name:has:har'
    const mockResponse = {
      category: { equals: 'task' },
      status: { IN: ['1', '2'] },
      date: { lt: '2022-10-11' },
      name: { contains: 'har', mode: 'insensitive' },
    }
    expect(query.getDbQuery({ filter })).toEqual(mockResponse)
  })

  it('should generate prisma query with whitelistProps and whitelistOps', () => {
    const filter = 'category:eq:task,status:in:[1,2],date:lt:2022-10-11,name:has:har'
    const whitelistProps: [string] = ['status']
    const whitelistOps: [string] = ['in']
    const mockResponse = { status: { IN: ['1', '2'] } }
    expect(query.getDbQuery({ filter, whitelistOps, whitelistProps })).toEqual(mockResponse)
  })

  it('should correctly generate the prisma query for selected fields', () => {
    const fields = 'id,name'
    const mockResponse = { id: true, name: true }
    expect(query.getDbQuerySelect({ fields })).toEqual(mockResponse)
  })

  it('should return empty object for empty fields', () => {
    const fields = ''
    const mockResponse = {}
    expect(query.getDbQuerySelect({ fields })).toEqual(mockResponse)
  })

  it('should correctly generate the prisma query for sorting', () => {
    const sort = 'name:desc'
    const mockResponse = { name: 'desc' }
    expect(query.getDbQuerySort({ sort })).toEqual(mockResponse)
  })
})
