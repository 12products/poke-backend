import { getNotificationTime, getNextSendTime } from './utils'

describe('Utils', () => {
  describe('getNotificationTime', () => {
    it('should normalize date to fixed month, day, year with seconds and milliseconds zeroed', () => {
      const inputDate = new Date('2024-06-15T14:30:45.123Z')
      const result = getNotificationTime(inputDate)

      expect(result.getMonth()).toBe(1) // February (0-indexed)
      expect(result.getDate()).toBe(1)
      expect(result.getFullYear()).toBe(2001)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
      // Hours and minutes should be preserved
      expect(result.getUTCHours()).toBe(14)
      expect(result.getUTCMinutes()).toBe(30)
    })

    it('should preserve hours and minutes from the original date', () => {
      const inputDate = new Date('2024-12-25T08:15:00.000Z')
      const result = getNotificationTime(inputDate)

      expect(result.getUTCHours()).toBe(8)
      expect(result.getUTCMinutes()).toBe(15)
    })

    it('should handle midnight correctly', () => {
      const inputDate = new Date('2024-01-01T00:00:00.000Z')
      const result = getNotificationTime(inputDate)

      expect(result.getUTCHours()).toBe(0)
      expect(result.getUTCMinutes()).toBe(0)
    })

    it('should handle end of day correctly', () => {
      const inputDate = new Date('2024-01-01T23:59:59.999Z')
      const result = getNotificationTime(inputDate)

      expect(result.getUTCHours()).toBe(23)
      expect(result.getUTCMinutes()).toBe(59)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })
  })

  describe('getNextSendTime', () => {
    it('should add 1 hour for tries=1', () => {
      const inputDate = new Date('2024-06-15T10:00:00.000Z')
      const result = getNextSendTime(inputDate, 1)

      // Should be 11:00 (10:00 + 1 hour), normalized
      expect(result.getUTCHours()).toBe(11)
      expect(result.getUTCMinutes()).toBe(0)
    })

    it('should add 2 hours for tries=2', () => {
      const inputDate = new Date('2024-06-15T10:00:00.000Z')
      const result = getNextSendTime(inputDate, 2)

      // Should be 12:00 (10:00 + 2 hours), normalized
      expect(result.getUTCHours()).toBe(12)
      expect(result.getUTCMinutes()).toBe(0)
    })

    it('should add 3 hours for tries=3', () => {
      const inputDate = new Date('2024-06-15T10:00:00.000Z')
      const result = getNextSendTime(inputDate, 3)

      // Should be 13:00 (10:00 + 3 hours), normalized
      expect(result.getUTCHours()).toBe(13)
      expect(result.getUTCMinutes()).toBe(0)
    })

    it('should handle hour overflow (crossing midnight)', () => {
      const inputDate = new Date('2024-06-15T23:00:00.000Z')
      const result = getNextSendTime(inputDate, 2)

      // Should be 01:00 (23:00 + 2 hours = 25:00 = 01:00 next day)
      expect(result.getUTCHours()).toBe(1)
      expect(result.getUTCMinutes()).toBe(0)
    })

    it('should return normalized date', () => {
      const inputDate = new Date('2024-06-15T10:30:45.123Z')
      const result = getNextSendTime(inputDate, 1)

      // Should be normalized (fixed month, day, year)
      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(1)
      expect(result.getFullYear()).toBe(2001)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })

    it('should preserve minutes when adding hours', () => {
      const inputDate = new Date('2024-06-15T10:45:00.000Z')
      const result = getNextSendTime(inputDate, 1)

      expect(result.getUTCHours()).toBe(11)
      expect(result.getUTCMinutes()).toBe(45)
    })
  })
})
