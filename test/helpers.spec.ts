import {
  validatePhoneNumber,
  validateEmail,
  validateTime,
  validateDays,
  validateTimezone,
  ValidationError,
} from '../src/helpers/validators';
import {
  formatStreakMessage,
  truncateText,
  capitalize,
  titleCase,
} from '../src/helpers/formatters';

describe('Validators', () => {
  describe('validatePhoneNumber', () => {
    it('should accept valid phone numbers', () => {
      expect(validatePhoneNumber('+11234567890')).toBe(true);
      expect(validatePhoneNumber('1234567890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('abcdefghij')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
  });

  describe('validateTime', () => {
    it('should accept valid time formats', () => {
      expect(validateTime('09:30')).toBe(true);
      expect(validateTime('23:59')).toBe(true);
      expect(validateTime('0:00')).toBe(true);
    });

    it('should reject invalid time formats', () => {
      expect(validateTime('25:00')).toBe(false);
      expect(validateTime('12:60')).toBe(false);
      expect(validateTime('invalid')).toBe(false);
    });
  });

  describe('validateDays', () => {
    it('should accept valid day arrays', () => {
      expect(validateDays([0, 1, 2])).toBe(true);
      expect(validateDays([6])).toBe(true);
    });

    it('should reject invalid day arrays', () => {
      expect(validateDays([])).toBe(false);
      expect(validateDays([7])).toBe(false);
      expect(validateDays([-1])).toBe(false);
    });
  });

  describe('validateTimezone', () => {
    it('should accept valid timezones', () => {
      expect(validateTimezone('America/New_York')).toBe(true);
      expect(validateTimezone('Europe/London')).toBe(true);
    });

    it('should reject invalid timezones', () => {
      expect(validateTimezone('Invalid/Timezone')).toBe(false);
    });
  });
});

describe('Formatters', () => {
  describe('formatStreakMessage', () => {
    it('should return appropriate message for 0 streak', () => {
      expect(formatStreakMessage(0)).toContain('Start your streak');
    });

    it('should return message for 1 day streak', () => {
      expect(formatStreakMessage(1)).toContain('1 day streak');
    });

    it('should return message for longer streaks', () => {
      expect(formatStreakMessage(10)).toContain('10 day streak');
    });
  });

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      expect(truncateText('hello', 10)).toBe('hello');
    });

    it('should truncate long text with ellipsis', () => {
      expect(truncateText('hello world', 8)).toBe('hello...');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
    });
  });

  describe('titleCase', () => {
    it('should title case text', () => {
      expect(titleCase('hello world')).toBe('Hello World');
    });
  });
});
