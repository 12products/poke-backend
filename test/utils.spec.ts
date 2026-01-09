import {
  getRandomElement,
  getRandomEmoji,
  sanitizePhoneNumber,
  isValidEmail,
  generateId,
  calculateStreak,
  sleep,
} from '../src/utils';
import { emojis } from '../src/constants';

describe('Utils', () => {
  describe('getRandomElement', () => {
    it('should return an element from the array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = getRandomElement(arr);
      expect(arr).toContain(result);
    });

    it('should work with string arrays', () => {
      const arr = ['a', 'b', 'c'];
      const result = getRandomElement(arr);
      expect(arr).toContain(result);
    });
  });

  describe('getRandomEmoji', () => {
    it('should return a valid emoji', () => {
      const result = getRandomEmoji();
      expect(emojis).toContain(result);
    });
  });

  describe('sanitizePhoneNumber', () => {
    it('should format 10-digit numbers correctly', () => {
      expect(sanitizePhoneNumber('1234567890')).toBe('+11234567890');
    });

    it('should format 11-digit numbers starting with 1', () => {
      expect(sanitizePhoneNumber('11234567890')).toBe('+11234567890');
    });

    it('should strip non-digit characters', () => {
      expect(sanitizePhoneNumber('(123) 456-7890')).toBe('+11234567890');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const id = generateId();
      const timestamp = parseInt(id.split('-')[0]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
    });
  });

  describe('calculateStreak', () => {
    it('should return 0 for empty array', () => {
      expect(calculateStreak([])).toBe(0);
    });

    it('should return 1 for single date', () => {
      expect(calculateStreak([new Date()])).toBe(1);
    });

    it('should calculate consecutive days', () => {
      const dates = [
        new Date('2024-01-03'),
        new Date('2024-01-02'),
        new Date('2024-01-01'),
      ];
      expect(calculateStreak(dates)).toBe(3);
    });
  });

  describe('sleep', () => {
    it('should wait for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(95);
    });
  });
});
