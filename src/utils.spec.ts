import { getNotificationTime, getNextSendTime } from './utils'

describe('utils', () => {
  describe('getNotificationTime', () => {
    it('should normalize the date to a fixed date with same hour and minute', () => {
      const date = new Date('2024-06-15T14:30:45.123Z')
      const result = getNotificationTime(date)

      expect(result.getFullYear()).toBe(2001)
      expect(result.getMonth()).toBe(1) // February (0-indexed)
      expect(result.getDate()).toBe(1)
      expect(result.getHours()).toBe(date.getHours())
      expect(result.getMinutes()).toBe(date.getMinutes())
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })

    it('should preserve hours and minutes from original date', () => {
      const date = new Date('2024-01-01T09:15:00.000Z')
      const result = getNotificationTime(date)

      expect(result.getHours()).toBe(9)
      expect(result.getMinutes()).toBe(15)
    })

    it('should handle midnight correctly', () => {
      const date = new Date('2024-12-25T00:00:00.000Z')
      const result = getNotificationTime(date)

      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
    })
  })

  describe('getNextSendTime', () => {
    it('should add hours based on tries count', () => {
      const date = new Date('2024-06-15T10:00:00.000Z')

      const result1 = getNextSendTime(date, 1)
      expect(result1.getHours()).toBe(11) // 10 + 1 hour

      const result2 = getNextSendTime(date, 2)
      expect(result2.getHours()).toBe(12) // 10 + 2 hours

      const result3 = getNextSendTime(date, 3)
      expect(result3.getHours()).toBe(13) // 10 + 3 hours
    })

    it('should wrap around midnight', () => {
      const date = new Date('2024-06-15T23:00:00.000Z')
      const result = getNextSendTime(date, 2)

      // 23 + 2 = 25, which wraps to 1
      expect(result.getHours()).toBe(1)
    })

    it('should normalize the resulting date', () => {
      const date = new Date('2024-06-15T10:30:45.123Z')
      const result = getNextSendTime(date, 1)

      expect(result.getFullYear()).toBe(2001)
      expect(result.getMonth()).toBe(1)
      expect(result.getDate()).toBe(1)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })
  })
})
