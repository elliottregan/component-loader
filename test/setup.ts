/**
 * Test setup - preloaded before each test file
 */
import { setupGlobalMocks, resetMocks } from './mocks/dom';
import { beforeEach, afterEach } from 'bun:test';

// Initialize global mocks
setupGlobalMocks();

// Reset mocks before each test
beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  resetMocks();
});
