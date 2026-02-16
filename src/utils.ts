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
 * Checks if a reminder notification window has expired.
 * A window is considered expired if more than 30 minutes have passed
 * since the scheduled notification time.
 */
export const isNotificationExpired = (
  scheduledTime: Date,
  currentTime: Date = new Date()
): boolean => {
  return differenceInMinutes(currentTime, scheduledTime) > 30
}

/**
 * Formats a phone number to E.164 format for Twilio.
 */
export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+1${digits}`
  }
  return `+${digits}`
}
