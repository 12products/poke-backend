import { set, add, format, differenceInDays } from 'date-fns'
import { emojis } from './constants'

/**
 * Normalizes a date for notification comparison
 * @param date - The date to normalize
 * @returns Date object with month, day, year, seconds, and milliseconds hardcoded
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
 * Calculates the next time to send a reminder
 * @param nextSendTime - The current send time
 * @param tries - Number of attempts already made (starts at 1)
 * @returns Date object for the next send attempt
 */
export const getNextSendTime = (nextSendTime: Date, tries: number): Date => {
  return getNotificationTime(add(nextSendTime, { hours: tries }))
}

/**
 * Gets a random emoji from the emojis list
 * @returns A random emoji string
 */
export const getRandomEmoji = (): string => {
  const randomIndex = Math.floor(Math.random() * emojis.length)
  return emojis[randomIndex]
}

/**
 * Formats a date for display in messages
 * @param date - The date to format
 * @returns Formatted date string
 */
export const formatMessageDate = (date: Date): string => {
  return format(date, 'EEEE, MMMM do, yyyy')
}

/**
 * Calculates the streak length from consecutive completions
 * @param completionDates - Array of completion dates
 * @returns Number of consecutive days
 */
export const calculateStreak = (completionDates: Date[]): number => {
  if (completionDates.length === 0) return 0

  const sortedDates = [...completionDates].sort((a, b) => b.getTime() - a.getTime())
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
 * Validates a phone number format
 * @param phone - The phone number to validate
 * @returns Boolean indicating if the phone number is valid
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''))
}

/**
 * Generates a unique message ID
 * @returns A unique string ID
 */
export const generateMessageId = (): string => {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `msg_${timestamp}_${randomPart}`
}
