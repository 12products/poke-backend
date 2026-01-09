import { set, add, differenceInMinutes } from 'date-fns'

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
 * Formats minutes into a human readable string
 * @param minutes : number of minutes
 * @returns : formatted string like "2h 30m" or "45m"
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Calculates how long ago a date was in a friendly format
 * @param date : the date to compare
 * @returns : formatted string like "5m ago" or "2h 30m ago"
 */
export const timeAgo = (date: Date): string => {
  const minutes = differenceInMinutes(new Date(), date)
  if (minutes < 1) {
    return 'just now'
  }
  return `${formatDuration(minutes)} ago`
}
