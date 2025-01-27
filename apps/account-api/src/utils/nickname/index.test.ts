import Filter from 'bad-words'
import * as ung from 'unique-names-generator'

import { getUniqueNickname, isValidNickname } from './index'

jest.mock('unique-names-generator')
jest.mock('bad-words')
jest.mock('../index', () => ({
  preRegisteredNicknames: ['admin', 'root'],
}))

describe('getUniqueNickname', () => {
  it('should generate a unique nickname with the specified length', () => {
    const mockGeneratedName = 'SunnyTigerBlueJohn1234'
    jest.spyOn(ung, 'uniqueNamesGenerator').mockReturnValue(mockGeneratedName)

    const nickname = getUniqueNickname(4)

    expect(ung.uniqueNamesGenerator).toHaveBeenCalledWith({
      dictionaries: [
        ung.adjectives,
        ung.animals,
        ung.colors,
        ung.names,
        ung.NumberDictionary.generate({ min: 0, max: 99999999 }),
      ],
      separator: '',
      style: 'capital',
      length: 4,
    })
    expect(nickname).toBe(mockGeneratedName)
  })

  it('should generate a unique nickname with the default length of 3', () => {
    const mockGeneratedName = 'SunnyTigerBlue'
    jest.spyOn(ung, 'uniqueNamesGenerator').mockReturnValue(mockGeneratedName)

    const nickname = getUniqueNickname()

    expect(ung.uniqueNamesGenerator).toHaveBeenCalledWith({
      dictionaries: [
        ung.adjectives,
        ung.animals,
        ung.colors,
        ung.names,
        ung.NumberDictionary.generate({ min: 0, max: 99999999 }),
      ],
      separator: '',
      style: 'capital',
      length: 3,
    })
    expect(nickname).toBe(mockGeneratedName)
  })
})

describe('isValidNickname', () => {
  let mockFilter: Filter

  beforeEach(() => {
    mockFilter = new Filter()
    jest.spyOn(mockFilter, 'isProfane').mockReturnValue(false)
    jest.spyOn(Filter.prototype, 'isProfane').mockImplementation(mockFilter.isProfane)
  })

  it('should return true for a valid nickname', () => {
    const nickname = 'ValidNickname1'

    const result = isValidNickname(nickname)

    expect(result).toBe(true)
    expect(Filter.prototype.isProfane).toHaveBeenCalledWith(nickname)
  })

  it('should return false for a nickname with invalid characters', () => {
    const nickname = 'Invalid@Name'

    const result = isValidNickname(nickname)

    expect(result).toBe(false)
  })

  it('should return false for a nickname that is profane', () => {
    jest.spyOn(Filter.prototype, 'isProfane').mockReturnValue(true)
    const nickname = 'BadWord'

    const result = isValidNickname(nickname)

    expect(result).toBe(false)
    expect(Filter.prototype.isProfane).toHaveBeenCalledWith(nickname)
  })

  it('should return false for a nickname that is too long', () => {
    const nickname = 'VeryLongNickname12345'

    const result = isValidNickname(nickname)

    expect(result).toBe(false)
  })

  it('should return false for a nickname that is pre-registered', () => {
    const nickname = 'admin'

    const result = isValidNickname(nickname)

    expect(result).toBe(false)
    expect(Filter.prototype.isProfane).toHaveBeenCalledWith(nickname)
  })

  it('should return false for an empty string', () => {
    const nickname = ''

    const result = isValidNickname(nickname)

    expect(result).toBe(false)
  })
})
