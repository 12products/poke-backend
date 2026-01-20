import { set, add, format } from 'date-fns'
import { dayNames } from './constants'

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
 * Picks a random element from an array
 */
export const pickRandom = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Formats notification days as human-readable string
 * e.g., [1, 3, 5] => "Monday, Wednesday, Friday"
 */
export const formatNotificationDays = (days: number[]): string => {
  if (days.length === 7) return 'Every day'
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
    return 'Weekdays'
  }
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return 'Weekends'
  }
  return days.map((d) => dayNames[d]).join(', ')
}

/**
 * Formats a time for display (12-hour format with AM/PM)
 */
export const formatTime = (date: Date): string => {
  return format(date, 'h:mm a')
}
