import Paginator from './paginator'

describe('Tests for paginator', () => {
  it('should correctly handle valid cursor', () => {
    const mockRequest = { cursor: 'eyJza2lwIjoxMjF9=', limit: '25' }
    const mockResponse = {
      cursor: 'eyJza2lwIjoxMjF9=',
      limit: 25,
      decoded: { skip: 121 },
    }
    expect(new Paginator(mockRequest)).toEqual(mockResponse)
  })

  it('should return null cursor if cursor string is invalid', () => {
    const mockRequest = { cursor: '%{}', limit: '25' }
    const mockResponse = { cursor: null, limit: 25, decoded: { skip: 0 } }
    expect(new Paginator(mockRequest)).toEqual(mockResponse)
  })

  it('should return null cursor if cursor string is not provided', () => {
    const mockRequest = { limit: '25' }
    const mockResponse = { cursor: null, limit: 25, decoded: { skip: 0 } }
    expect(new Paginator(mockRequest)).toEqual(mockResponse)
  })

  it('should return null cursor and limit 25 if parameters are not passed', () => {
    const mockRequest = {}
    const mockResponse = { cursor: null, limit: 25, decoded: { skip: 0 } }
    expect(new Paginator(mockRequest)).toEqual(mockResponse)
  })

  it('should return null cursor and limit 100 if limit exceeds 100', () => {
    const mockRequest = { limit: '110' }
    const mockResponse = { cursor: null, limit: 100, decoded: { skip: 0 } }
    expect(new Paginator(mockRequest)).toEqual(mockResponse)
  })
})

describe('Tests for getNextCursor method of Paginator', () => {
  it('should return new cursor', () => {
    const mockRequest = { cursor: 'eyJza2lwIjoxMjF9=', limit: '25' }
    const paginator = new Paginator(mockRequest)
    const limit = paginator.limit || 25
    const skip = paginator.decoded.skip
    const mockResponse = Buffer.from(JSON.stringify({ skip: skip + limit })).toString('base64')

    expect(paginator.getNextCursor(200)).toEqual(mockResponse)
  })

  it('should return epmty cursor', () => {
    const mockRequest = { cursor: 'eyJza2lwIjoxMjF9=', limit: '25' }
    const mockResponse = null
    const paginator = new Paginator(mockRequest)

    expect(paginator.getNextCursor(1)).toEqual(mockResponse)
  })
})
