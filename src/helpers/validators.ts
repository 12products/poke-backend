import { DAYS_OF_WEEK } from '../constants';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const validateDays = (days: number[]): boolean => {
  if (!Array.isArray(days) || days.length === 0) return false;
  return days.every((day) => day >= 0 && day <= 6);
};

export const validateTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

export const validateReminderTitle = (title: string): boolean => {
  return title.length >= 1 && title.length <= 200;
};

export const validateReminderDescription = (description: string): boolean => {
  return description.length <= 1000;
};

export const assertValidPhone = (phone: string): void => {
  if (!validatePhoneNumber(phone)) {
    throw new ValidationError('Invalid phone number format', 'phone');
  }
};

export const assertValidEmail = (email: string): void => {
  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
};

export const assertValidSchedule = (days: number[], time: string, timezone: string): void => {
  if (!validateDays(days)) {
    throw new ValidationError('Days must be an array of numbers from 0-6', 'days');
  }
  if (!validateTime(time)) {
    throw new ValidationError('Time must be in HH:MM format', 'time');
  }
  if (!validateTimezone(timezone)) {
    throw new ValidationError('Invalid timezone', 'timezone');
  }
};

export const getDayName = (dayNumber: number): string => {
  return DAYS_OF_WEEK[dayNumber] || 'unknown';
};
