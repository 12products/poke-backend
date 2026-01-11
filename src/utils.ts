import { set, add, format, differenceInDays } from 'date-fns'

/**
 *
 * @param time : date object
 * @returns : date object with month, day, year, seconds, and milliseconds hardcoded
 */
export const getNotificationTime = (date: Date): Date => {
  return set(date, {
    month: 1,
    date: 1,
    year: 2001,
    seconds: 0,
    milliseconds: 0,
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
 */
export const formatDisplayDate = (date: Date): string => {
  return format(date, 'MMMM do, yyyy')
}

/**
 * Calculates the streak length between two dates
 */
export const calculateStreak = (startDate: Date, endDate: Date): number => {
  return Math.abs(differenceInDays(endDate, startDate))
}

/**
 * Generates a random ID for tracking purposes
 */
export const generateTrackingId = (): string => {
  return `poke_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Validates a phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''))
}
