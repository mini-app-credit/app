/**
 * Test Data Fixtures
 * Reusable test data constants for e2e tests
 */

export const AUTH_TEST_DATA = {
  VALID_EMAIL: 'user@example.com',
  VALID_PASSWORD: 'TestPassword123!@#',
  VALID_EMAIL_2: 'another@example.com',
  INVALID_EMAIL: 'not-an-email',
  WEAK_PASSWORD: 'weak',
  SHORT_PASSWORD: '123',

  VALID_CAPTCHA_TOKEN: 'valid-captcha-token-for-testing',
  INVALID_CAPTCHA_TOKEN: 'invalid-token',
  EXPIRED_CAPTCHA_TOKEN: 'expired-token',

  JWT_TEST_SECRET: 'test-jwt-secret-key-very-long-for-testing-purposes-only',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

export const ERROR_CODES = {
  USER_ALREADY_EXISTS: 10001,
  INVALID_CREDENTIALS: 10002,
  EMAIL_NOT_VERIFIED: 10003,
  ACCOUNT_NOT_FOUND: 10004,
  TOKEN_EXPIRED: 10005,
  TOKEN_INVALID: 10006,
  CAPTCHA_FAILED: 10007,
  RATE_LIMIT_EXCEEDED: 10008,
  EMAIL_ALREADY_VERIFIED: 10010,
  INVALID_TOKEN: 10012,
  // Messaging error codes
  CHAT_NOT_FOUND: 10001,
  CONVERSATION_NOT_FOUND: 10002,
  INVALID_PROVIDER_MODEL: 10003,
  PROVIDER_NOT_FOUND: 10004,
  MODEL_NOT_FOUND: 10005,
  INSUFFICIENT_CREDITS: 10006,
  CHAT_ACCESS_FORBIDDEN: 10008,
  CONVERSATION_SAVE_ERROR: 10009,
  CHAT_SAVE_ERROR: 10010,
  // Billing error codes
  INVALID_AMOUNT: 20001,
  INVOICE_NOT_FOUND: 20002,
  PAYMENT_NOT_FOUND: 20003,
  PAYMENT_METHOD_NOT_FOUND: 20004,
  INVALID_INVOICE_STATUS: 20005,
  INVALID_PAYMENT_STATUS: 20006,
};

export const RATE_LIMIT_THRESHOLDS = {
  PUBLIC: 100, // per minute per IP
  AUTH_SENSITIVE: 10, // per minute per IP+email
  AUTHENTICATED: 300, // per minute per user
};

/**
 * Default sign-up request payload
 */
export function createSignUpPayload(overrides?: Partial<{ email: string; password: string; captchaToken: string }>) {
  return {
    email: AUTH_TEST_DATA.VALID_EMAIL,
    password: AUTH_TEST_DATA.VALID_PASSWORD,
    captchaToken: AUTH_TEST_DATA.VALID_CAPTCHA_TOKEN,
    ...overrides,
  };
}

/**
 * Default sign-in request payload
 */
export function createSignInPayload(email?: string, password?: string) {
  return {
    email: email || AUTH_TEST_DATA.VALID_EMAIL,
    password: password || AUTH_TEST_DATA.VALID_PASSWORD,
    captchaToken: AUTH_TEST_DATA.VALID_CAPTCHA_TOKEN,
  };
}

/**
 * Default email verification request payload
 */
export function createEmailVerifyPayload(overrides?: Partial<{ email: string; token: string }>) {
  return {
    email: AUTH_TEST_DATA.VALID_EMAIL,
    token: 'test-verification-token-here',
    ...overrides,
  };
}

/**
 * Default password reset request payload
 */
export function createPasswordResetPayload(overrides?: Partial<{ email: string; token: string; newPassword: string }>) {
  return {
    email: AUTH_TEST_DATA.VALID_EMAIL,
    token: 'test-password-reset-token-here',
    newPassword: AUTH_TEST_DATA.VALID_PASSWORD,
    ...overrides,
  };
}

/**
 * Default refresh token request payload
 */
export function createRefreshTokenPayload(refreshToken: string) {
  return {
    refreshToken,
  };
}

/**
 * Common error response structure
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  code?: number;
  details?: any;
}

/**
 * Helper to check error response
 */
export function isErrorResponse(response: any): response is ErrorResponse {
  return (
    response &&
    typeof response.statusCode === 'number' &&
    typeof response.message === 'string'
  );
}

/**
 * Test timeout constants
 */
export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 15000,
  LONG: 30000,
  VERY_LONG: 60000,
};

