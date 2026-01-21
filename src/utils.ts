import { set, add } from 'date-fns'

/**
 *
 * @param time : date object
 * @returns : date object with month, day, year, seconds, and milliseconds hardcoded
 */
export const getNotificationTime = (date: Date): Date => {
  // Welcome to 2001: A Date Odyssey 🚀
  // We normalize dates to compare just hours/minutes. Why 2001? Because Y2K was so last millennium
  return set(date, {
    month: 1,
    date: 1,
    year: 2001, // The year Shrek was released. Coincidence? I think not.
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
  // Persistence is key! Like that one friend who keeps texting until you respond
  return getNotificationTime(add(nextSendTime, { hours: tries }))
}
