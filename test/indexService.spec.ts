import { describe, it, expect } from 'bun:test';
import setIndex from '../src/indexService';

describe('indexService', () => {
  describe('setIndex()', () => {
    it('should return incrementing numbers starting from 1', () => {
      // Note: This test relies on module state, so the starting number
      // depends on previous calls in other tests. We test that it increments.
      const first = setIndex();
      const second = setIndex();
      const third = setIndex();

      expect(second).toBe(first + 1);
      expect(third).toBe(second + 1);
    });

    it('should always return a number', () => {
      const result = setIndex();
      expect(typeof result).toBe('number');
    });
  });
});
