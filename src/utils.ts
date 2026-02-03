// Utility functions for the Poke application
// These are pure functions used across multiple modules
import { set, add } from 'date-fns'

/**
 * Normalizes a date to a standard format for notification time comparison
 *
 * We store notification times with a fixed date (Feb 1, 2001) so we can
 * compare just the time portion across different days. This is a bit of
 * a hack but it works!
 *
 * @param date : date object to normalize
 * @returns : date object with month, day, year, seconds, and milliseconds hardcoded
 */
export const getNotificationTime = (date: Date): Date => {
  // Set to a fixed date so we only compare hours and minutes
  return set(date, {
    month: 1, // February (0-indexed)
    date: 1, // First day
    year: 2001, // Arbitrary year - 2001: A Space Odyssey reference maybe?
    seconds: 0, // Zero out seconds
    milliseconds: 0, // Zero out milliseconds
  })
}

/**
 * Calculates the next time a message should be sent
 *
 * This implements exponential backoff - each retry waits longer
 * The wait time increases by 1 hour for each failed attempt
 *
 * @param nextSendTime : Date of current time
 * @param tries : number of tries message has already been sent, starts at 1
 * @returns : a date object with specific date in UTC
 */
export const getNextSendTime = (nextSendTime: Date, tries: number): Date => {
  // Add hours based on the number of tries, then normalize
  return getNotificationTime(add(nextSendTime, { hours: tries }))
}
