// Utils: where all the helper functions live
// Think of this as the toolbox under the sink
import { set, add } from 'date-fns'

/**
 *
 * @param time : date object
 * @returns : date object with month, day, year, seconds, and milliseconds hardcoded
 */
export const getNotificationTime = (date: Date): Date => {
  // Why 2001? Because it's the year of Space Odyssey
  // Also, we just need a consistent date for comparison
  return set(date, {
    month: 1, // February because why not
    date: 1, // First of the month, rent is due
    year: 2001, // A space odyssey indeed
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
