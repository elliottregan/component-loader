import { describe, it, expect } from 'bun:test';
import { id, isValidSelector } from '../src/util';

describe('util', () => {
  describe('id()', () => {
    it('should return an 8-character hex string', () => {
      const result = id();
      expect(result).toMatch(/^[0-9a-f]{8}$/);
    });

    it('should return unique values on each call', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(id());
      }
      // With random generation, we expect all 100 to be unique
      expect(ids.size).toBe(100);
    });
  });

  describe('isValidSelector()', () => {
    it('should return true for valid CSS selectors', () => {
      expect(isValidSelector('.my-class')).toBe(true);
      expect(isValidSelector('#my-id')).toBe(true);
      expect(isValidSelector('div')).toBe(true);
      expect(isValidSelector('[data-component]')).toBe(true);
      expect(isValidSelector('div.class#id')).toBe(true);
      expect(isValidSelector('div > span')).toBe(true);
    });

    it('should return false for falsy values', () => {
      expect(isValidSelector('')).toBe(false);
      expect(isValidSelector(null as unknown as string)).toBe(false);
      expect(isValidSelector(undefined as unknown as string)).toBe(false);
    });

    it('should return false for invalid CSS selectors', () => {
      expect(isValidSelector('..')).toBe(false);
      expect(isValidSelector('. ')).toBe(false);
      expect(isValidSelector('# ')).toBe(false);
    });
  });
});
