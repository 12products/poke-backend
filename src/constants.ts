// Application-wide constants
export const APP_NAME = 'Poke'
export const APP_VERSION = '2.0.0'

// Notification emojis for messages
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
  '✨',
]

// Status codes for reminders
export const REMINDER_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  COMPLETED: 'completed',
  SNOOZED: 'snoozed',
  FAILED: 'failed',
} as const

// Default configuration values
export const DEFAULT_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 5000,
  maxRemindersPerUser: 50,
  defaultTimezone: 'America/New_York',
}
