/**
 * Validation utilities for the Poke backend
 */

/**
 * Validates that a string is a valid phone number format
 * Supports formats: +1234567890, 1234567890, (123) 456-7890
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

/**
 * Validates that a string is a valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates that a timezone string is valid
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Validates notification days array (0-6, Sunday-Saturday)
 */
export const isValidNotificationDays = (days: number[]): boolean => {
  if (!Array.isArray(days) || days.length === 0) return false
  return days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
}

/**
 * Validates that a reminder text is within acceptable limits
 */
export const isValidReminderText = (text: string): boolean => {
  if (typeof text !== 'string') return false
  const trimmed = text.trim()
  return trimmed.length >= 1 && trimmed.length <= 500
}

/**
 * Validates UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Sanitizes phone number to standard format
 */
export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '')
}

/**
 * Validates that a date is in the future
 */
export const isFutureDate = (date: Date): boolean => {
  return date.getTime() > Date.now()
}

/**
 * Validates cron expression (basic validation)
 */
export const isValidCronExpression = (cron: string): boolean => {
  const parts = cron.trim().split(/\s+/)
  return parts.length >= 5 && parts.length <= 6
}
