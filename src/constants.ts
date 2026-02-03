export const emojis = [
  // Animals
  '🦄',
  '🦊',
  '🦁',
  '🐼',
  '🐨',
  '🦋',
  '🐬',
  '🦜',
  '🐢',
  '🦈',
  // Faces
  '🥰',
  '😇',
  '🤩',
  '😜',
  '🤗',
  '😎',
  '🥳',
  '😊',
  // Food
  '🍔',
  '🍎',
  '🍉',
  '🍕',
  '🍩',
  '🥑',
  '🍓',
  '🌮',
  // Sports & Activities
  '🏃',
  '🚴',
  '🏋️',
  '🧘',
  '⚽',
  '🎯',
  // Nature & Objects
  '🌟',
  '🔥',
  '💎',
  '🎸',
  '📚',
  '✨',
  // See no evil monkey (original)
  '🙉',
]

export const REMINDER_COLORS = [
  'blue',
  'green',
  'red',
  'purple',
  'orange',
  'pink',
  'teal',
  'yellow',
] as const

export type ReminderColor = (typeof REMINDER_COLORS)[number]

export const MAX_REMINDER_RETRIES = 4
export const RETRY_INTERVAL_HOURS = 1
