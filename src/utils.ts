import { set, add, format, differenceInDays } from 'date-fns';
import { emojis, motivationalMessages } from './constants';

/**
 * Get a random element from an array
 */
export const getRandomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Get a random emoji
 */
export const getRandomEmoji = (): string => {
  return getRandomElement(emojis);
};

/**
 * Get a random motivational message
 */
export const getRandomMotivation = (): string => {
  return getRandomElement(motivationalMessages);
};

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
  });
};

/**
 *
 * @param nextSendTime : Date of current time
 * @param tries : number of tries message has already been sent, starts at 1
 * @returns : a date object with specific date in UTC
 */
export const getNextSendTime = (nextSendTime: Date, tries: number): Date => {
  return getNotificationTime(add(nextSendTime, { hours: tries }));
};

/**
 * Format a date for display
 */
export const formatDisplayDate = (date: Date): string => {
  return format(date, 'MMMM d, yyyy');
};

/**
 * Format a time for display
 */
export const formatDisplayTime = (date: Date): string => {
  return format(date, 'h:mm a');
};

/**
 * Calculate streak based on completion dates
 */
export const calculateStreak = (completionDates: Date[]): number => {
  if (completionDates.length === 0) return 0;

  const sorted = [...completionDates].sort(
    (a, b) => b.getTime() - a.getTime()
  );
  let streak = 1;

  for (let i = 0; i < sorted.length - 1; i++) {
    const diff = differenceInDays(sorted[i], sorted[i + 1]);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Sleep for a given number of milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, i));
      }
    }
  }

  throw lastError;
};

/**
 * Sanitize phone number to E.164 format
 */
export const sanitizePhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate a simple unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
