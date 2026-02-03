// Utility functions for date manipulation
// These helpers are used throughout the application for time-related operations
import { set, add } from 'date-fns'

/**
 * Normalizes a date to a consistent format for comparison
 * This is crucial for matching notification times across timezones
 *
 * @param time : date object
 * @returns : date object with month, day, year, seconds, and milliseconds hardcoded
 */
export const getNotificationTime = (date: Date): Date => {
  // Set fixed date components to normalize the time
  // We only care about hours and minutes for notification matching
  return set(date, {
    month: 1, // February (0-indexed)
    date: 1, // First day of month
    year: 2001, // Arbitrary fixed year
    seconds: 0, // Zero out seconds
    milliseconds: 0, // Zero out milliseconds
  })
}

/**
 * Calculates the next send time based on retry attempts
 * Uses exponential backoff by adding hours equal to try count
 *
 * @param nextSendTime : Date of current time
 * @param tries : number of tries message has already been sent, starts at 1
 * @returns : a date object with specific date in UTC
 */
export const getNextSendTime = (nextSendTime: Date, tries: number): Date => {
  // Add hours based on number of tries, then normalize
  // This creates a simple backoff: 1hr, 2hr, 3hr, 4hr delays
  return getNotificationTime(add(nextSendTime, { hours: tries }))
}
