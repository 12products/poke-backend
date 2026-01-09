import { format, formatDistanceToNow } from 'date-fns';
import { getRandomEmoji } from '../utils';

export const formatReminderMessage = (title: string, includeEmoji = true): string => {
  const emoji = includeEmoji ? `${getRandomEmoji()} ` : '';
  return `${emoji}Reminder: ${title}`;
};

export const formatCompletionMessage = (title: string): string => {
  return `Great job completing "${title}"! Keep up the good work! 🎉`;
};

export const formatStreakMessage = (streak: number): string => {
  if (streak === 0) return "Start your streak today!";
  if (streak === 1) return "You're on a 1 day streak! 🔥";
  if (streak < 7) return `${streak} day streak! Keep it going! 🔥`;
  if (streak < 30) return `Amazing! ${streak} day streak! 🔥🔥`;
  return `Incredible! ${streak} day streak! You're unstoppable! 🔥🔥🔥`;
};

export const formatRelativeTime = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true });
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'PPpp');
};

export const formatDate = (date: Date): string => {
  return format(date, 'PP');
};

export const formatTime = (date: Date): string => {
  return format(date, 'p');
};

export const formatPhoneForDisplay = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const titleCase = (text: string): string => {
  return text
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
};
