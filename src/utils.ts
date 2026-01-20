import { set, add, differenceInMinutes, format, parseISO, isValid } from 'date-fns'
import { MAX_RETRY_ATTEMPTS, RETRY_INTERVAL_HOURS } from './constants'

/**
 * Normalizes a date object to a standard notification time format.
 * This allows comparing times across different days.
 *
 * @param date - The date object to normalize
 * @returns A date object with month, day, year, seconds, and milliseconds hardcoded
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
 * Calculates the next send time for a reminder message.
 *
 * @param nextSendTime - The current time as a Date object
 * @param tries - The number of attempts already made (starts at 1)
 * @returns A normalized date object representing the next send time
 */
export const getNextSendTime = (nextSendTime: Date, tries: number): Date => {
  const hoursToAdd = Math.min(tries, MAX_RETRY_ATTEMPTS) * RETRY_INTERVAL_HOURS
  return getNotificationTime(add(nextSendTime, { hours: hoursToAdd }))
}

/**
 * Validates a phone number format.
 * Expects format: country code + number (e.g., "11234567890")
 *
 * @param phone - The phone number to validate
 * @returns True if the phone number is valid
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\d{10,15}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

/**
 * Formats a phone number for display.
 *
 * @param phone - The phone number to format
 * @returns Formatted phone number string
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return `+${cleaned}`
}

/**
 * Calculates if a reminder should still be active based on tries.
 *
 * @param tries - Current number of retry attempts
 * @returns True if the reminder should remain active
 */
export const shouldRemainActive = (tries: number): boolean => {
  return tries < MAX_RETRY_ATTEMPTS
}

/**
 * Calculates the minutes until the next scheduled notification.
 *
 * @param scheduledTime - The scheduled notification time
 * @param currentTime - The current time (defaults to now)
 * @returns Number of minutes until the notification
 */
export const minutesUntilNotification = (
  scheduledTime: Date,
  currentTime: Date = new Date()
): number => {
  return differenceInMinutes(scheduledTime, currentTime)
}

/**
 * Formats a date for logging purposes.
 *
 * @param date - The date to format
 * @returns Formatted date string
 */
export const formatDateForLog = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm:ss')
}

/**
 * Safely parses an ISO date string.
 *
 * @param dateString - The ISO date string to parse
 * @returns Parsed Date object or null if invalid
 */
export const safeParseDate = (dateString: string): Date | null => {
  try {
    const parsed = parseISO(dateString)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Generates a unique identifier for tracking purposes.
 *
 * @returns A unique string identifier
 */
export const generateTrackingId = (): string => {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `poke_${timestamp}_${randomPart}`
}

/**
 * Delays execution for a specified number of milliseconds.
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Truncates a string to a maximum length with ellipsis.
 *
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}
