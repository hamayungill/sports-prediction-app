import { addMinutes, getTimeStamp } from './dateTime'

describe('Utility Functions', () => {
  describe('addMinutes', () => {
    it('should add the specified number of minutes to the current date and return a Date object', () => {
      const minutesToAdd = 10
      const currentTime = new Date().getTime()
      const expectedTime = new Date(currentTime + minutesToAdd * 60000)

      const result = addMinutes(minutesToAdd)

      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -2) // Allowing minor time differences
    })

    it('should return a valid Date object when adding 0 minutes', () => {
      const minutesToAdd = 0
      const currentTime = new Date().getTime()

      const result = addMinutes(minutesToAdd)

      expect(result.getTime()).toBeCloseTo(currentTime, -2) // Allowing minor time differences
    })

    it('should handle negative minutes and return a Date object in the past', () => {
      const minutesToSubtract = -10
      const currentTime = new Date().getTime()
      const expectedTime = new Date(currentTime + minutesToSubtract * 60000)

      const result = addMinutes(minutesToSubtract)

      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -2)
    })

    it('should handle large numbers for minutesToAdd', () => {
      const minutesToAdd = 10000
      const currentTime = new Date().getTime()
      const expectedTime = new Date(currentTime + minutesToAdd * 60000)

      const result = addMinutes(minutesToAdd)

      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -2)
    })
  })

  describe('getTimeStamp', () => {
    it('should return the correct timestamp for a valid date string', () => {
      const date = '2024-10-01T00:00:00Z' // ISO date format
      const expectedTimestamp = new Date(date).getTime()

      const result = getTimeStamp(date)

      expect(result).toBe(expectedTimestamp)
    })

    it('should return NaN for an invalid date string', () => {
      const invalidDate = 'invalid-date'

      const result = getTimeStamp(invalidDate)

      expect(result).toBeNaN()
    })

    it('should return the current timestamp if passed a valid current date', () => {
      const date = new Date().toISOString()
      const expectedTimestamp = new Date(date).getTime()

      const result = getTimeStamp(date)

      expect(result).toBe(expectedTimestamp)
    })

    it('should handle empty string and return NaN', () => {
      const result = getTimeStamp('')

      expect(result).toBeNaN()
    })
  })
})
