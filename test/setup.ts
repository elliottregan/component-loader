/**
 * Test setup - preloaded before each test file
 */
import { afterEach, beforeEach } from "bun:test";
import { resetMocks, setupGlobalMocks } from "./mocks/dom";

// Initialize global mocks
setupGlobalMocks();

// Reset mocks before each test
beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  resetMocks();
});
