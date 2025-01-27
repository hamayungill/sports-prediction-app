import query from '../query'

describe('Tests for query parsers', () => {
  it('should correctly generate the prisma query with "gt" and "lt" dates', () => {
    const filter = 'category:eq:task,status:in:[1,2],date:gt:2022-10-11,date:lt:2022-11-11,name:has:har'
    const mockResponse = {
      category: { equals: 'task' },
      status: { IN: ['1', '2'] },
      date: { gt: '2022-10-11', lt: '2022-11-11' },
      name: { contains: 'har', mode: 'insensitive' },
    }
    expect(query.getDbQuery({ filter })).toEqual(mockResponse)
  })

  it('should correctly generate the prisma query with "gte" and "lte" dates', () => {
    const filter = 'category:eq:task,status:in:[1,2],date:gte:2022-10-11,date:lte:2022-11-11,name:has:har'
    const mockResponse = {
      category: { equals: 'task' },
      status: { IN: ['1', '2'] },
      date: { gte: '2022-10-11', lte: '2022-11-11' },
      name: { contains: 'har', mode: 'insensitive' },
    }
    expect(query.getDbQuery({ filter })).toEqual(mockResponse)
  })

  it('should return empty object for incorrect sort value', () => {
    const sort = 'name:'
    const mockResponse = {}
    expect(query.getDbQuerySort({ sort })).toEqual(mockResponse)
  })

  it('should return empty object for empty sort value', () => {
    const sort = ''
    const mockResponse = {}
    expect(query.getDbQuerySort({ sort })).toEqual(mockResponse)
  })
})
