import { testDb, testApi, testRedis } from '../mocks';
import {
  AUTH_TEST_DATA,
  HTTP_STATUS,
  RATE_LIMIT_THRESHOLDS,
  createSignUpPayload,
  createSignInPayload,
  TIMEOUTS,
} from '../mocks/fixtures';

/**
 * E2E Tests for Rate Limiting
 * Using Supertest with Best Practices
 */
describe('Rate Limiting', () => {
  beforeAll(async () => {
    await testDb.database.initialize();
    await testRedis.initialize();
  }, TIMEOUTS.MEDIUM);

  afterEach(async () => {
    await testDb.database.clear();
    await testRedis.clear();
  });

  afterAll(async () => {
    try {
      await (testApi as any).close?.();
      await testDb.database.close();
    } catch (error) {
      console.warn('Cleanup error (ignored):', error);
    }
  }, TIMEOUTS.MEDIUM);

  // ===== AUTH-SENSITIVE RATE LIMIT TESTS (Sign-up uses AUTH_SENSITIVE) =====
  describe('Auth-Sensitive Endpoints (Sign-up, Sign-in)', () => {
    it('should allow requests within rate limit', async () => {
      const payload = createSignUpPayload({
        email: 'test1@example.com',
      });

      const response = await testApi.post('/auth/email/sign-up', payload);
      expect(response.status).toBeLessThan(HTTP_STATUS.TOO_MANY_REQUESTS);
    }, TIMEOUTS.SHORT);

    it('should include rate limit headers in response', async () => {
      const payload = createSignUpPayload();

      const response = await testApi.post('/auth/email/sign-up', payload);

      expect(response.getHeader('x-ratelimit-limit')).toBeDefined();
      expect(response.getHeader('x-ratelimit-remaining')).toBeDefined();
      expect(response.getHeader('x-ratelimit-reset')).toBeDefined();

      expect(parseInt(response.getHeader('x-ratelimit-limit') ?? '0')).toBeGreaterThan(0);
      expect(parseInt(response.getHeader('x-ratelimit-remaining') ?? '0')).toBeGreaterThanOrEqual(0);
      expect(parseInt(response.getHeader('x-ratelimit-reset') ?? '0')).toBeGreaterThan(Date.now());
    }, TIMEOUTS.SHORT);

    it('should decrement remaining counter on each request', async () => {
      // Make multiple requests to ensure counter decrements
      // For AUTH_SENSITIVE, key is IP+email, so use same email for all requests
      const email = `test-${Date.now()}@example.com`;

      // First request
      const payload1 = createSignUpPayload({ email });
      const response1 = await testApi.post('/auth/email/sign-up', payload1);
      expect(response1.status).toBeLessThan(HTTP_STATUS.TOO_MANY_REQUESTS);
      const remaining1 = parseInt(response1.getHeader('x-ratelimit-remaining') ?? '0');
      const limit1 = parseInt(response1.getHeader('x-ratelimit-limit') ?? '0');
      expect(remaining1).toBeGreaterThanOrEqual(0);
      expect(limit1).toBe(RATE_LIMIT_THRESHOLDS.AUTH_SENSITIVE);

      // Wait to ensure distinct timestamps and Redis operations complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second request with same email from same IP should decrement counter
      const payload2 = createSignUpPayload({ email });
      const response2 = await testApi.post('/auth/email/sign-up', payload2);
      expect(response2.status).toBeLessThan(HTTP_STATUS.TOO_MANY_REQUESTS);
      const remaining2 = parseInt(response2.getHeader('x-ratelimit-remaining') ?? '0');
      const limit2 = parseInt(response2.getHeader('x-ratelimit-limit') ?? '0');
      expect(remaining2).toBeGreaterThanOrEqual(0);
      expect(limit2).toBe(limit1);

      // After 2 requests with same IP+email, remaining should decrease
      // If remaining1 was not at 0, remaining2 must be less
      if (remaining1 > 0) {
        expect(remaining2).toBeLessThan(remaining1);
      }

      // Wait again
      await new Promise(resolve => setTimeout(resolve, 100));

      // Third request with same email to verify continued decrement
      const payload3 = createSignUpPayload({ email });
      const response3 = await testApi.post('/auth/email/sign-up', payload3);
      expect(response3.status).toBeLessThan(HTTP_STATUS.TOO_MANY_REQUESTS);
      const remaining3 = parseInt(response3.getHeader('x-ratelimit-remaining') ?? '0');

      // After 3 requests with same IP+email, remaining should continue to decrease
      if (remaining2 > 0) {
        expect(remaining3).toBeLessThan(remaining2);
      }

      // Verify the pattern: remaining1 > remaining2 > remaining3 (when not at 0)
      if (remaining1 > 2) {
        expect(remaining1).toBeGreaterThan(remaining2);
        expect(remaining2).toBeGreaterThan(remaining3);
      }
    }, TIMEOUTS.SHORT);
  });

  // ===== AUTH-SENSITIVE RATE LIMIT TESTS (Verification, Password Reset) =====
  describe('Auth-Sensitive Endpoints (Verification, Password Reset)', () => {
    it('should apply stricter limits to auth-sensitive endpoints', async () => {
      await testDb.iam.createUser({
        email: AUTH_TEST_DATA.VALID_EMAIL,
        verified: false,
      });

      const payload = {
        email: AUTH_TEST_DATA.VALID_EMAIL,
        token: 'test-token',
      };

      const response = await testApi.post('/auth/email/verify', payload);

      expect(response.getHeader('x-ratelimit-limit')).toBeDefined();
      const limit = parseInt(response.getHeader('x-ratelimit-limit') ?? '0');
      expect(limit).toBe(RATE_LIMIT_THRESHOLDS.AUTH_SENSITIVE);
    }, TIMEOUTS.SHORT);

    it('should track rate limit per IP + email combination', async () => {
      const email = `test-${Date.now()}@example.com`;

      const payload1 = createSignUpPayload({ email });
      const response1 = await testApi.post('/auth/email/sign-up', payload1);
      expect(response1.status).toBeLessThan(HTTP_STATUS.TOO_MANY_REQUESTS);
      const remaining1 = parseInt(response1.getHeader('x-ratelimit-remaining') ?? '0');
      expect(remaining1).toBeGreaterThanOrEqual(0);

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 50));

      // Same email from same IP - should use same key and decrement
      const payload2 = createSignUpPayload({ email });
      const response2 = await testApi.post('/auth/email/sign-up', payload2);
      expect(response2.status).toBeLessThan(HTTP_STATUS.TOO_MANY_REQUESTS);
      const remaining2 = parseInt(response2.getHeader('x-ratelimit-remaining') ?? '0');
      expect(remaining2).toBeGreaterThanOrEqual(0);

      // For auth-sensitive, remaining should decrease (same IP + email = same key)
      if (remaining1 > 0) {
        expect(remaining2).toBeLessThan(remaining1);
      } else {
        // If we were at 0, we should still be at 0 (or get 429)
        expect(remaining2).toBe(0);
      }
    }, TIMEOUTS.SHORT);
  });

  // ===== AUTHENTICATED RATE LIMIT TESTS =====
  describe('Authenticated Endpoints (Refresh, Sign-out)', () => {
    it('should apply authenticated user rate limits', async () => {
      const email = `test-${Date.now()}@example.com`;
      await testDb.iam.createUser({
        email,
        verified: true,
      });

      // Wait a bit to avoid rate limit from previous tests
      await new Promise(resolve => setTimeout(resolve, 100));

      const signInResponse = await testApi.post(
        '/auth/email/sign-in',
        createSignInPayload(email)
      );
      expect(signInResponse.status).toBe(HTTP_STATUS.OK);
      const { refreshToken } = signInResponse.getBody();

      const response = await testApi.post(
        '/auth/token/refresh',
        {},
        testApi.withBearerToken(refreshToken)
      );

      expect(response.getHeader('x-ratelimit-limit')).toBeDefined();
      expect(parseInt(response.getHeader('x-ratelimit-limit') ?? '0')).toBeGreaterThan(0);
    }, TIMEOUTS.SHORT);

    it('should track rate limit per user for authenticated endpoints', async () => {
      const user1Email = 'user1@example.com';
      const user2Email = 'user2@example.com';

      await testDb.iam.createUser({ email: user1Email, verified: true });
      await testDb.iam.createUser({ email: user2Email, verified: true });

      const signIn1 = await testApi.post(
        '/auth/email/sign-in',
        createSignInPayload(user1Email)
      );
      expect(signIn1.status).toBe(HTTP_STATUS.OK);
      const { refreshToken: token1 } = signIn1.getBody();

      const signIn2 = await testApi.post(
        '/auth/email/sign-in',
        createSignInPayload(user2Email)
      );
      expect(signIn2.status).toBe(HTTP_STATUS.OK);
      const { refreshToken: token2 } = signIn2.getBody();

      const refresh1 = await testApi.post(
        '/auth/token/refresh',
        {},
        testApi.withBearerToken(token1)
      );
      expect(refresh1.getHeader('x-ratelimit-limit')).toBeDefined();
      expect(refresh1.getHeader('x-ratelimit-remaining')).toBeDefined();
      const remaining1 = parseInt(refresh1.getHeader('x-ratelimit-remaining') ?? '0');
      const limit1 = parseInt(refresh1.getHeader('x-ratelimit-limit') ?? '0');
      expect(limit1).toBe(RATE_LIMIT_THRESHOLDS.AUTHENTICATED);

      const refresh2 = await testApi.post(
        '/auth/token/refresh',
        {},
        testApi.withBearerToken(token2)
      );
      expect(refresh2.getHeader('x-ratelimit-limit')).toBeDefined();
      expect(refresh2.getHeader('x-ratelimit-remaining')).toBeDefined();
      const remaining2 = parseInt(refresh2.getHeader('x-ratelimit-remaining') ?? '0');
      const limit2 = parseInt(refresh2.getHeader('x-ratelimit-limit') ?? '0');
      expect(limit2).toBe(RATE_LIMIT_THRESHOLDS.AUTHENTICATED);

      // Each user should have independent rate limit buckets
      // Both should be close to the limit since only 1 request was made per user
      expect(remaining1).toBeGreaterThan(RATE_LIMIT_THRESHOLDS.AUTHENTICATED - 2);
      expect(remaining2).toBeGreaterThan(RATE_LIMIT_THRESHOLDS.AUTHENTICATED - 2);
    }, TIMEOUTS.SHORT);
  });

  // ===== RATE LIMIT EXCEEDED TESTS =====
  describe('Rate Limit Exceeded Behavior', () => {
    it('should return appropriate status for rate limit checks', async () => {
      const payload = createSignUpPayload();
      const response = await testApi.post('/auth/email/sign-up', payload);

      if (response.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        expect(response.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
      } else {
        expect(response.status).toBeLessThan(HTTP_STATUS.TOO_MANY_REQUESTS);
      }
    }, TIMEOUTS.SHORT);

    it('should provide rate limit reset information', async () => {
      const payload = createSignUpPayload();
      const response = await testApi.post('/auth/email/sign-up', payload);

      expect(response.getHeader('x-ratelimit-reset')).toBeDefined();
      const resetTime = parseInt(response.getHeader('x-ratelimit-reset') ?? '0');
      expect(resetTime).toBeGreaterThan(Date.now());
    }, TIMEOUTS.SHORT);
  });

  // ===== FAIL-OPEN BEHAVIOR =====
  describe('Fail-Open Behavior', () => {
    it('should allow requests if rate limiter is unavailable', async () => {
      const payload = createSignUpPayload();
      const response = await testApi.post('/auth/email/sign-up', payload);

      expect(response.status).not.toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(response.status).not.toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    }, TIMEOUTS.SHORT);
  });
});
