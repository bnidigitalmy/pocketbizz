import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config();

// Setup test environment
beforeAll(() => {
  // Ensure we're in test mode
  process.env.NODE_ENV = 'test';
  
  // Disable Sentry in tests
  delete process.env.SENTRY_DSN;
  delete process.env.VITE_SENTRY_DSN;
});

afterAll(() => {
  // Cleanup after all tests
});
