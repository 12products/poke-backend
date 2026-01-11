export const emojis = [
  '🦄',
  '🥰',
  '🍔',
  '🙉',
  '🍎',
  '😇',
  '🦊',
  '🍉',
  '🤩',
  '🦁',
  '😜',
  '🚀',
  '💪',
  '🎯',
  '⭐',
  '🔥',
]

export const DEFAULT_TIMEZONE = 'America/New_York'

export const MAX_REMINDERS_PER_USER = 10

export const RETRY_ATTEMPTS = 3

export const motivationalMessages = [
  "You've got this!",
  "Keep pushing forward!",
  "One step at a time!",
  "Stay focused!",
  "You're doing great!",
  "Every day is a new opportunity!",
  "Progress, not perfection!",
  "Small steps lead to big changes!",
]

export const NOTIFICATION_COOLDOWN_MS = 60 * 1000 // 1 minute

export const API_VERSION = 'v1'

export const ERROR_MESSAGES = {
  REMINDER_NOT_FOUND: 'Reminder not found',
  USER_NOT_FOUND: 'User not found',
  SUBSCRIPTION_REQUIRED: 'Active subscription required',
  INVALID_PHONE: 'Invalid phone number format',
  TWILIO_ERROR: 'Failed to send SMS',
} as const

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES
