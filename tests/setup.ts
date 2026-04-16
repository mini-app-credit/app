import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Jest Setup for E2E Tests
 * Loads .env.test before running tests
 */

// Load test environment variables
const envPath = path.join(__dirname, '..', '.env.test');
dotenv.config({ path: envPath });

// Set test environment
process.env.NODE_ENV = 'test';

// Optional: Set longer timeout for CI environments
if (process.env.CI) {
  jest.setTimeout(60000);
}

// Extend Jest matchers with custom domain matchers
expect.extend({
  toBeVerified(received: any) {
    const pass = received?.verified_at !== null && received?.verified_at !== undefined;
    return {
      message: () => `Expected account to be verified, but verified_at is ${received?.verified_at}`,
      pass,
    };
  },
  toBeUnverified(received: any) {
    const pass = received?.verified_at === null || received?.verified_at === undefined;
    return {
      message: () => `Expected account to be unverified, but verified_at is ${received?.verified_at}`,
      pass,
    };
  },
  toBeHashed(received: string, original: string) {
    const pass = received !== original && received.startsWith('$argon2id$');
    return {
      message: () => `Expected password to be hashed, but got ${received}`,
      pass,
    };
  },
  toBeValidJWT(received: string) {
    const parts = received?.split('.');
    const pass = parts?.length === 3 && typeof received === 'string' && received.length > 10;
    return {
      message: () => `Expected valid JWT token, but got ${received}`,
      pass,
    };
  },
});
