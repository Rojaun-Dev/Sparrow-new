import { beforeAll, afterAll, beforeEach } from '@jest/globals';

// Global test setup for unit tests
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});