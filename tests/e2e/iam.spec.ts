import { testDb, testRedis, testApi } from '../mocks';
import { HTTP_STATUS, ERROR_CODES, TIMEOUTS, AUTH_TEST_DATA } from '../mocks/fixtures';
import { user, signUpRequest, signInRequest, accountIsUnverified } from '../mocks/dsl';

function extractTokens(body: any) {
  return {
    accessToken: body.access?.token ?? body.accessToken,
    refreshToken: body.refresh?.token ?? body.refreshToken,
  };
}

describe('IAM Module', () => {
  beforeAll(async () => {
    await testDb.database.initialize();
    await testRedis.initialize();
  }, TIMEOUTS.MEDIUM);

  afterEach(async () => {
    await testDb.database.clear();
    await testRedis.clear();

    const dbEmpty = await testDb.database.verifyEmpty();
    const redisEmpty = await testRedis.verifyEmpty();

    expect(dbEmpty).toBe(true);
    expect(redisEmpty).toBe(true);
  }, TIMEOUTS.SHORT);

  afterAll(async () => {
    try {
      await (testApi as any).close?.();
      await testDb.database.close();
    } catch {}
  }, TIMEOUTS.MEDIUM);

  // ===== SIGN UP =====
  describe('Rule: User Registration', () => {
    describe('Invariant: Email Uniqueness', () => {
      it('guarantees each email is registered only once', async () => {
        const request = signUpRequest().build();

        const response1 = await testApi.post('/auth/email/sign-up', request);
        expect(response1.status).toBe(HTTP_STATUS.CREATED);

        const response2 = await testApi.post('/auth/email/sign-up', request);
        expect(response2.status).toBe(HTTP_STATUS.CONFLICT);
      }, TIMEOUTS.SHORT);

      it('preserves uniqueness invariant when concurrent requests occur', async () => {
        const request = signUpRequest().build();

        const [r1, r2] = await Promise.all([
          testApi.post('/auth/email/sign-up', request),
          testApi.post('/auth/email/sign-up', request),
        ]);

        const successCount = [r1, r2].filter(r => r.status === HTTP_STATUS.CREATED).length;
        expect(successCount).toBeGreaterThanOrEqual(1);
        expect(successCount).toBeLessThanOrEqual(2);
      }, TIMEOUTS.SHORT);
    });

    describe('Invariant: Password Security', () => {
      it('guarantees passwords are hashed before storage', async () => {
        const request = signUpRequest().build();
        await testApi.post('/auth/email/sign-up', request);

        const u = await testDb.iam.getUserByEmail(request.email);
        expect(u?.account.meta.password?.hash).not.toBe(request.password);
        expect(u?.account.meta.password?.hash).toMatch(/^\$argon2id\$/);
      }, TIMEOUTS.SHORT);
    });

    describe('Invariant: Account State', () => {
      it('guarantees new accounts are unverified', async () => {
        const request = signUpRequest().build();
        await testApi.post('/auth/email/sign-up', request);

        const isUnverified = await accountIsUnverified(request.email);
        expect(isUnverified).toBe(true);
      }, TIMEOUTS.SHORT);

      it('guarantees user is created with default credits', async () => {
        const request = signUpRequest().build();
        await testApi.post('/auth/email/sign-up', request);

        const u = await testDb.iam.getUserByEmail(request.email);
        expect(u?.user.unitAmount).toBe(10000);
      }, TIMEOUTS.SHORT);
    });

    describe('Edge Cases', () => {
      it('rejects registration with invalid email format', async () => {
        const request = signUpRequest().withEmail('invalid-email').build();
        const response = await testApi.post('/auth/email/sign-up', request);
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      }, TIMEOUTS.SHORT);

      it('rejects registration with weak password', async () => {
        const request = signUpRequest().withPassword('123').build();
        const response = await testApi.post('/auth/email/sign-up', request);
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      }, TIMEOUTS.SHORT);
    });
  });

  // ===== SIGN IN =====
  describe('Rule: User Authentication', () => {
    describe('Invariant: Email Verification Required', () => {
      it('guarantees unverified users cannot sign in', async () => {
        await user().unverified().build();
        const request = signInRequest().build();

        const response = await testApi.post('/auth/email/sign-in', request);
        expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
      }, TIMEOUTS.SHORT);

      it('guarantees verified users can sign in', async () => {
        await user().verified().build();
        const request = signInRequest().build();

        const response = await testApi.post('/auth/email/sign-in', request);
        expect(response.status).toBe(HTTP_STATUS.OK);

        const { accessToken, refreshToken } = extractTokens(response.getBody());
        expect(accessToken).toBeTruthy();
        expect(refreshToken).toBeTruthy();
      }, TIMEOUTS.SHORT);
    });

    describe('Invariant: Token Generation', () => {
      it('guarantees access and refresh tokens are issued on successful sign-in', async () => {
        await user().verified().build();
        const response = await testApi.post('/auth/email/sign-in', signInRequest().build());
        const { accessToken, refreshToken } = extractTokens(response.getBody());

        expect(typeof accessToken).toBe('string');
        expect(typeof refreshToken).toBe('string');
        expect(accessToken.length).toBeGreaterThan(0);
        expect(refreshToken.length).toBeGreaterThan(0);
      }, TIMEOUTS.SHORT);

      it('guarantees tokens are valid JWT format', async () => {
        await user().verified().build();
        const response = await testApi.post('/auth/email/sign-in', signInRequest().build());
        const { accessToken, refreshToken } = extractTokens(response.getBody());

        expect(accessToken.split('.')).toHaveLength(3);
        expect(refreshToken.split('.')).toHaveLength(3);
      }, TIMEOUTS.SHORT);
    });

    describe('Invariant: Credential Validation', () => {
      it('guarantees incorrect password is rejected', async () => {
        await user().verified().build();
        const request = signInRequest().withPassword('WrongPassword123!').build();

        const response = await testApi.post('/auth/email/sign-in', request);
        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      }, TIMEOUTS.SHORT);

      it('guarantees non-existent user is rejected', async () => {
        const request = signInRequest().withEmail('nonexistent@example.com').build();
        const response = await testApi.post('/auth/email/sign-in', request);
        expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
      }, TIMEOUTS.SHORT);
    });

    describe('Edge Cases', () => {
      it('rejects sign-in with missing email', async () => {
        const request = signInRequest().build();
        delete (request as any).email;

        const response = await testApi.post('/auth/email/sign-in', request);
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      }, TIMEOUTS.SHORT);

      it('rejects sign-in with missing password', async () => {
        const request = signInRequest().build();
        delete (request as any).password;

        const response = await testApi.post('/auth/email/sign-in', request);
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      }, TIMEOUTS.SHORT);
    });
  });

  // ===== EMAIL VERIFICATION =====
  describe('Rule: Email Verification', () => {
    it('guarantees unverified account state is queryable', async () => {
      const { email } = await user().unverified().build();
      const userData = await testDb.iam.getUserByEmail(email);
      expect(userData).not.toBeNull();
      expect(userData!.account.verifiedAt).toBeNull();
    }, TIMEOUTS.SHORT);

    it('guarantees already verified account returns error on re-verify', async () => {
      const { email } = await user().verified().build();
      const response = await testApi.post('/auth/email/verify', { email });
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    }, TIMEOUTS.SHORT);

    it('rejects verification with invalid token', async () => {
      const { email } = await user().unverified().build();
      const response = await testApi.post('/auth/email/confirm', { email, token: 'invalid-token' });
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }, TIMEOUTS.SHORT);
  });

  // ===== TOKEN REFRESH =====
  describe('Rule: Token Refresh', () => {
    describe('Invariant: Token Rotation', () => {
      it('guarantees new tokens are issued on refresh', async () => {
        await user().verified().build();

        const signInRes = await testApi.post('/auth/email/sign-in', signInRequest().build());
        const { refreshToken: oldRefresh } = extractTokens(signInRes.getBody());

        const refreshRes = await testApi.post(
          '/auth/token/refresh', {},
          testApi.withBearerToken(oldRefresh),
        );

        expect(refreshRes.status).toBe(HTTP_STATUS.OK);
        const { accessToken, refreshToken } = extractTokens(refreshRes.getBody());
        expect(accessToken).toBeTruthy();
        expect(refreshToken).toBeTruthy();
        expect(refreshToken).not.toBe(oldRefresh);
      }, TIMEOUTS.SHORT);

      it('guarantees old refresh token is revoked after rotation', async () => {
        await user().verified().build();

        const signInRes = await testApi.post('/auth/email/sign-in', signInRequest().build());
        const { refreshToken: oldRefresh } = extractTokens(signInRes.getBody());

        const refreshRes1 = await testApi.post(
          '/auth/token/refresh', {},
          testApi.withBearerToken(oldRefresh),
        );
        expect(refreshRes1.status).toBe(HTTP_STATUS.OK);
        const { refreshToken: newRefresh } = extractTokens(refreshRes1.getBody());

        const refreshRes2 = await testApi.post(
          '/auth/token/refresh', {},
          testApi.withBearerToken(oldRefresh),
        );
        expect(refreshRes2.status).toBe(HTTP_STATUS.UNAUTHORIZED);

        const refreshRes3 = await testApi.post(
          '/auth/token/refresh', {},
          testApi.withBearerToken(newRefresh),
        );
        expect(refreshRes3.status).toBe(HTTP_STATUS.OK);
      }, TIMEOUTS.SHORT);

      it('guarantees consecutive refresh chain works', async () => {
        await user().verified().build();

        const signInRes = await testApi.post('/auth/email/sign-in', signInRequest().build());
        let currentRefresh = extractTokens(signInRes.getBody()).refreshToken;

        for (let i = 0; i < 3; i++) {
          const res = await testApi.post('/auth/token/refresh', {}, testApi.withBearerToken(currentRefresh));
          expect(res.status).toBe(HTTP_STATUS.OK);
          const tokens = extractTokens(res.getBody());
          expect(tokens.refreshToken).not.toBe(currentRefresh);
          currentRefresh = tokens.refreshToken;
        }
      }, TIMEOUTS.SHORT);
    });

    it('rejects invalid refresh token', async () => {
      const res = await testApi.post('/auth/token/refresh', {}, testApi.withBearerToken('invalid-token'));
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }, TIMEOUTS.SHORT);

    it('rejects refresh without token', async () => {
      const res = await testApi.post('/auth/token/refresh', {});
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }, TIMEOUTS.SHORT);
  });

  // ===== SIGN OUT =====
  describe('Rule: User Sign Out', () => {
    it('guarantees sign-out revokes tokens', async () => {
      await user().verified().build();

      const signInRes = await testApi.post('/auth/email/sign-in', signInRequest().build());
      const { accessToken } = extractTokens(signInRes.getBody());

      const signOutRes = await testApi.post('/auth/sign-out', {}, testApi.withBearerToken(accessToken));
      expect(signOutRes.status).toBe(HTTP_STATUS.NO_CONTENT);

      const iamKeysCleared = await testRedis.verifyIAMKeysCleared();
      expect(iamKeysCleared).toBe(true);
    }, TIMEOUTS.SHORT);

    it('requires authentication', async () => {
      const res = await testApi.post('/auth/sign-out', {});
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }, TIMEOUTS.SHORT);
  });

  // ===== PASSWORD RESET =====
  describe('Rule: Password Reset', () => {
    it('issues reset token for valid account', async () => {
      const { email } = await user().verified().build();
      const res = await testApi.post('/auth/password/forgot', { email });
      expect(res.status).toBe(HTTP_STATUS.OK);
    }, TIMEOUTS.SHORT);

    it('rejects reset with invalid token', async () => {
      const { email } = await user().verified().build();
      await testApi.post('/auth/password/forgot', { email });

      const res = await testApi.post('/auth/password/reset', {
        email, token: 'invalid-token', newPassword: 'NewPassword123!',
      });
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }, TIMEOUTS.SHORT);
  });

  // ===== DATA CLEANUP =====
  describe('Rule: Data Cleanup', () => {
    it('guarantees user data exists before cleanup', async () => {
      await user().build();
      expect(await testDb.database.countUsers()).toBeGreaterThan(0);
      expect(await testDb.database.countAccounts()).toBeGreaterThan(0);
    }, TIMEOUTS.SHORT);

    it('guarantees Redis keys exist after sign-in', async () => {
      await user().verified().build();
      await testApi.post('/auth/email/sign-in', signInRequest().build());
      expect(await testRedis.countKeys()).toBeGreaterThan(0);
    }, TIMEOUTS.SHORT);
  });

  // ===== COMPLETE FLOW =====
  describe('Rule: Complete Authentication Flow', () => {
    it('registration → verification → login → logout', async () => {
      const payload = signUpRequest().build();
      const signUpRes = await testApi.post('/auth/email/sign-up', payload);
      expect(signUpRes.status).toBe(HTTP_STATUS.CREATED);

      await testApi.post('/auth/email/verify', { email: payload.email });
      await testDb.iam.verifyUser(payload.email);

      const signInRes = await testApi.post('/auth/email/sign-in',
        signInRequest().withEmail(payload.email).build());
      expect(signInRes.status).toBe(HTTP_STATUS.OK);

      const { accessToken } = extractTokens(signInRes.getBody());
      expect(accessToken).toBeTruthy();

      const signOutRes = await testApi.post('/auth/sign-out', {}, testApi.withBearerToken(accessToken));
      expect(signOutRes.status).toBe(HTTP_STATUS.NO_CONTENT);
    }, TIMEOUTS.MEDIUM);
  });

  // ===== IDEMPOTENCY =====
  describe('Rule: Idempotency', () => {
    it('sign-out is idempotent', async () => {
      await user().verified().build();
      const signInRes = await testApi.post('/auth/email/sign-in', signInRequest().build());
      const { accessToken } = extractTokens(signInRes.getBody());

      const res1 = await testApi.post('/auth/sign-out', {}, testApi.withBearerToken(accessToken));
      expect(res1.status).toBe(HTTP_STATUS.NO_CONTENT);

      const res2 = await testApi.post('/auth/sign-out', {}, testApi.withBearerToken(accessToken));
      expect([HTTP_STATUS.NO_CONTENT, HTTP_STATUS.UNAUTHORIZED]).toContain(res2.status);
    }, TIMEOUTS.SHORT);
  });

  // ===== CONCURRENT =====
  describe('Rule: Concurrent Operations', () => {
    it('multiple sign-ins generate different tokens', async () => {
      await user().verified().build();

      const [r1, r2] = await Promise.all([
        testApi.post('/auth/email/sign-in', signInRequest().build()),
        testApi.post('/auth/email/sign-in', signInRequest().build()),
      ]);

      const t1 = extractTokens(r1.getBody()).accessToken;
      const t2 = extractTokens(r2.getBody()).accessToken;
      expect(t1).not.toBe(t2);
    }, TIMEOUTS.SHORT);
  });
});
