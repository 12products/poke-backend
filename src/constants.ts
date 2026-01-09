// Application constants and configuration values

export const APP_NAME = 'Poke';
export const APP_VERSION = '2.0.0';

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
  '🔥',
  '💯',
  '🏆',
  '⚡',
  '🌟',
];

export const motivationalMessages = [
  "You've got this!",
  "Keep pushing forward!",
  "One step at a time!",
  "Progress, not perfection!",
  "Stay consistent!",
  "You're doing great!",
  "Small wins count!",
  "Don't give up!",
];

export const DEFAULT_TIMEZONE = 'America/New_York';
export const MAX_REMINDERS_PER_USER = 25;
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 5000;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

export const DAYS_OF_WEEK = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
