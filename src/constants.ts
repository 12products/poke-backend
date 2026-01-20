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
  '⭐',
  '🎯',
  '💪',
  '🏆',
  '🌟',
  '✨',
  '🎉',
  '🔥',
]

export const MAX_REMINDERS_FREE = 1
export const MAX_REMINDERS_PREMIUM = 50
export const MAX_RETRY_ATTEMPTS = 4
export const RETRY_INTERVAL_HOURS = 1

export const MESSAGE_TEMPLATES = {
  POKE_REMINDER: (text: string, emoji: string) =>
    `${text}.\n\nRespond with ${emoji} to acknowledge this poke!`,
  POKE_AGAIN: "We'll give you another poke in a bit!",
  POKE_SUCCESS: 'Great work!',
  POKE_EXPIRED: 'This poke has expired. Better luck next time!',
}

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const

export const TIME_ZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
] as const

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS]
export type TimeZone = typeof TIME_ZONES[number]
