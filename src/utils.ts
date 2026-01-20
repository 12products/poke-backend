import { set, add, format, differenceInDays, isValid } from 'date-fns'
import { NOTIFICATION_DEFAULTS } from './constants'

/**
 *
 * @param time : date object
 * @returns : date object with month, day, year, seconds, and milliseconds hardcoded
 */
export const getNotificationTime = (date: Date): Date => {
  return set(date, {
    month: NOTIFICATION_DEFAULTS.MONTH,
    date: NOTIFICATION_DEFAULTS.DATE,
    year: NOTIFICATION_DEFAULTS.YEAR,
    seconds: NOTIFICATION_DEFAULTS.SECONDS,
    milliseconds: NOTIFICATION_DEFAULTS.MILLISECONDS,
  })
}
/**
 *
 * @param nextSendTime : Date of current time
 * @param tries : number of tries message has already been sent, starts at 1
 * @returns : a date object with specific date in UTC
 */

export const getNextSendTime = (nextSendTime: Date, tries: number): Date => {
  return getNotificationTime(add(nextSendTime, { hours: tries }))
}

/**
 * Formats a date for display in messages
 * @param date - The date to format
 * @returns Formatted date string
 */
export const formatReminderTime = (date: Date): string => {
  if (!isValid(date)) {
    return 'Invalid date'
  }
  return format(date, "EEEE, MMMM do 'at' h:mm a")
}

/**
 * Calculates the streak count based on consecutive days
 * @param dates - Array of dates when reminders were acknowledged
 * @returns Number of consecutive days in the streak
 */
export const calculateStreak = (dates: Date[]): number => {
  if (!dates.length) return 0

  const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime())
  let streak = 1

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const diff = differenceInDays(sortedDates[i], sortedDates[i + 1])
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

/**
 * Validates a phone number format
 * @param phone - Phone number string to validate
 * @returns Boolean indicating if phone is valid
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''))
}

/**
 * Generates a random ID for testing purposes
 * @param length - Length of the ID
 * @returns Random alphanumeric string
 */
export const generateRandomId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Sanitizes user input to prevent XSS
 * @param input - Raw user input string
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
