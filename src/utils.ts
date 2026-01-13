import { set, add, format, differenceInMinutes, isWeekend, startOfDay, endOfDay } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

/**
 * Date and time utility functions for the Poke backend
 */

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
 * Format a date for display in user's timezone
 */
export const formatDateForUser = (date: Date, timezone: string): string => {
  const zonedDate = utcToZonedTime(date, timezone)
  return format(zonedDate, 'PPpp')
}

/**
 * Format time only (HH:mm) for display
 */
export const formatTimeOnly = (date: Date, timezone: string): string => {
  const zonedDate = utcToZonedTime(date, timezone)
  return format(zonedDate, 'HH:mm')
}

/**
 * Get the current time in a specific timezone
 */
export const getCurrentTimeInZone = (timezone: string): Date => {
  return utcToZonedTime(new Date(), timezone)
}

/**
 * Convert a local time to UTC
 */
export const localToUtc = (date: Date, timezone: string): Date => {
  return zonedTimeToUtc(date, timezone)
}

/**
 * Check if current time is within quiet hours
 * Default quiet hours: 10pm - 7am
 */
export const isQuietHours = (
  timezone: string,
  quietStart = 22,
  quietEnd = 7
): boolean => {
  const now = getCurrentTimeInZone(timezone)
  const hour = now.getHours()

  if (quietStart > quietEnd) {
    // Quiet hours span midnight
    return hour >= quietStart || hour < quietEnd
  }
  return hour >= quietStart && hour < quietEnd
}

/**
 * Calculate minutes until next notification window
 */
export const minutesUntilNextWindow = (
  nextTime: Date,
  timezone: string
): number => {
  const now = getCurrentTimeInZone(timezone)
  return differenceInMinutes(nextTime, now)
}

/**
 * Check if a date falls on a weekend
 */
export const isWeekendDay = (date: Date): boolean => {
  return isWeekend(date)
}

/**
 * Get start of day in a specific timezone
 */
export const getStartOfDayInZone = (timezone: string): Date => {
  const now = getCurrentTimeInZone(timezone)
  return startOfDay(now)
}

/**
 * Get end of day in a specific timezone
 */
export const getEndOfDayInZone = (timezone: string): Date => {
  const now = getCurrentTimeInZone(timezone)
  return endOfDay(now)
}

/**
 * Parse a time string (HH:mm) into hours and minutes
 */
export const parseTimeString = (timeStr: string): { hours: number; minutes: number } | null => {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return { hours, minutes }
}

/**
 * Create a date object for a specific time today in a timezone
 */
export const createTimeToday = (hours: number, minutes: number, timezone: string): Date => {
  const now = getCurrentTimeInZone(timezone)
  const result = set(now, { hours, minutes, seconds: 0, milliseconds: 0 })
  return zonedTimeToUtc(result, timezone)
}

/**
 * Get an array of day names
 */
export const getDayNames = (short = false): string[] => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return short ? days.map((d) => d.slice(0, 3)) : days
}

/**
 * Convert day indices to readable string
 * e.g., [1,2,3,4,5] -> "Mon-Fri"
 */
export const formatDayIndices = (indices: number[]): string => {
  if (indices.length === 0) return 'Never'
  if (indices.length === 7) return 'Every day'

  const sorted = [...indices].sort((a, b) => a - b)
  const dayNames = getDayNames(true)

  // Check for weekdays
  if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) {
    return 'Weekdays'
  }

  // Check for weekends
  if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) {
    return 'Weekends'
  }

  // Default: list the days
  return sorted.map((i) => dayNames[i]).join(', ')
}

/**
 * Calculate exponential backoff delay
 */
export const calculateBackoffDelay = (
  attempt: number,
  baseDelayMs = 1000,
  maxDelayMs = 30000
): number => {
  const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs)
  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() * 2 - 1)
  return Math.round(delay + jitter)
}

/**
 * Sleep for a specified number of milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> => {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxAttempts - 1) {
        const delay = calculateBackoffDelay(attempt, baseDelayMs)
        await sleep(delay)
      }
    }
  }

  throw lastError
}

/**
 * Generate a random string of specified length
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Truncate a string with ellipsis
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Pick specific keys from an object
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Omit specific keys from an object
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result as Omit<T, K>
}
