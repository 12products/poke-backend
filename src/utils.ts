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
 * Calculates the streak count for a user's reminders
 * @param completedDates - Array of dates when reminders were completed
 * @returns The current streak count
 */
export const calculateStreak = (completedDates: Date[]): number => {
  if (completedDates.length === 0) return 0

  const sortedDates = completedDates
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime())

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
 * Formats a date for display in notifications
 * @param date - The date to format
 * @returns Formatted date string
 */
export const formatNotificationDate = (date: Date): string => {
  return format(date, 'EEEE, MMMM do')
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
