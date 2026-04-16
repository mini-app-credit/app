import { testDb } from './database';
import { AUTH_TEST_DATA } from './fixtures';

// ===== Factories =====

export class UserFactory {
  private email: string = AUTH_TEST_DATA.VALID_EMAIL;
  private password: string = AUTH_TEST_DATA.VALID_PASSWORD;
  private isVerified: boolean = false;
  private unitAmount: number = 10000;

  withEmail(email: string): this {
    this.email = email;
    return this;
  }

  withPassword(password: string): this {
    this.password = password;
    return this;
  }

  verified(): this {
    this.isVerified = true;
    return this;
  }

  unverified(): this {
    this.isVerified = false;
    return this;
  }

  withCredits(amount: number): this {
    this.unitAmount = amount;
    return this;
  }

  async build(): Promise<{ userId: string; accountId: string; email: string }> {
    return testDb.iam.createUser({
      email: this.email,
      password: this.password,
      verified: this.isVerified,
    });
  }
}

export function user() {
  return new UserFactory();
}

// ===== Request Builders =====

export class SignUpRequestBuilder {
  private email: string = AUTH_TEST_DATA.VALID_EMAIL;
  private password: string = AUTH_TEST_DATA.VALID_PASSWORD;
  private captchaToken: string = AUTH_TEST_DATA.VALID_CAPTCHA_TOKEN;

  withEmail(email: string): this {
    this.email = email;
    return this;
  }

  withPassword(password: string): this {
    this.password = password;
    return this;
  }

  withCaptcha(token: string): this {
    this.captchaToken = token;
    return this;
  }

  build() {
    return {
      email: this.email,
      password: this.password,
      captchaToken: this.captchaToken,
    };
  }
}

export function signUpRequest() {
  return new SignUpRequestBuilder();
}

export class SignInRequestBuilder {
  private email: string = AUTH_TEST_DATA.VALID_EMAIL;
  private password: string = AUTH_TEST_DATA.VALID_PASSWORD;
  private captchaToken: string = AUTH_TEST_DATA.VALID_CAPTCHA_TOKEN;

  withEmail(email: string): this {
    this.email = email;
    return this;
  }

  withPassword(password: string): this {
    this.password = password;
    return this;
  }

  withCaptcha(token: string): this {
    this.captchaToken = token;
    return this;
  }

  build() {
    return {
      email: this.email,
      password: this.password,
      captchaToken: this.captchaToken,
    };
  }
}

export function signInRequest() {
  return new SignInRequestBuilder();
}

// ===== Custom Matchers =====

export const DomainMatchers = {
  toBeVerified(account: any) {
    const pass = account?.verified_at !== null && account?.verified_at !== undefined;
    return { message: () => `Expected account to be verified`, pass };
  },

  toBeUnverified(account: any) {
    const pass = account?.verified_at === null || account?.verified_at === undefined;
    return { message: () => `Expected account to be unverified`, pass };
  },

  toBeHashed(password: string, original: string) {
    const pass = password !== original && password.startsWith('$argon2id$');
    return { message: () => `Expected password to be hashed`, pass };
  },

  toBeValidJWT(token: string) {
    const parts = token?.split('.');
    const pass = parts?.length === 3 && typeof token === 'string' && token.length > 10;
    return { message: () => `Expected valid JWT token`, pass };
  },

  toBeDifferentToken(token1: string, token2: string) {
    const pass = token1 !== token2;
    return { message: () => `Expected tokens to be different`, pass };
  },
};

// ===== Verification Helpers =====

export async function userExists(email: string): Promise<boolean> {
  const user = await testDb.iam.getUserByEmail(email);
  return user !== null;
}

export async function userNotExists(email: string): Promise<boolean> {
  return !(await userExists(email));
}

export async function accountIsVerified(email: string): Promise<boolean> {
  const user = await testDb.iam.getUserByEmail(email);
  return user?.account.verified_at !== null && user?.account.verified_at !== undefined;
}

export async function accountIsUnverified(email: string): Promise<boolean> {
  const user = await testDb.iam.getUserByEmail(email);
  return user?.account.verified_at === null || user?.account.verified_at === undefined;
}

export async function databaseIsEmpty(): Promise<boolean> {
  return testDb.database.verifyEmpty();
}
