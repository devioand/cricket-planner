require("@testing-library/jest-dom");

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment to ignore console logs/warns during testing
  // log: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(),
};
