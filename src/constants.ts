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
  '🐸',
  '🌟',
  '🔥',
  '💎',
]

export const MAX_REMINDERS_FREE_TIER = 1
export const MAX_REMINDERS_PREMIUM = 10
export const MAX_RETRY_ATTEMPTS = 4
export const RETRY_INTERVAL_HOURS = 1

export const RESPONSE_MESSAGES = {
  SUCCESS: 'Great work!',
  RETRY: "We'll give you another poke in a bit!",
  SUBSCRIPTION_REQUIRED: 'Need an active subscription for more reminders',
  INVALID_REMINDER: 'Reminder not found or access denied',
} as const

export const NOTIFICATION_DEFAULTS = {
  MONTH: 1,
  DATE: 1,
  YEAR: 2001,
  SECONDS: 0,
  MILLISECONDS: 0,
} as const

export type ResponseMessageKey = keyof typeof RESPONSE_MESSAGES
