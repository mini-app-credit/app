import { DomainError } from "src/shared";

export const IAM_ERROR_CODES = {
  USER_ALREADY_EXISTS: 10001,
  INVALID_CREDENTIALS: 10002,
  EMAIL_NOT_VERIFIED: 10003,
  ACCOUNT_NOT_FOUND: 10004,
  ACCOUNT_ALREADY_EXISTS: 10005,
  USER_NOT_FOUND: 10006,
  INVALID_EMAIL_FORMAT: 10007,
  INVALID_PASSWORD: 10008,
  PROVIDER_NOT_SUPPORTED: 10009,
  EMAIL_ALREADY_VERIFIED: 10010,
  CAPTCHA_VALIDATION_FAILED: 10011,
  INVALID_TOKEN: 10012,
} as const;

export class UserAlreadyExistsError extends DomainError {
  readonly code = IAM_ERROR_CODES.USER_ALREADY_EXISTS;
  readonly statusCode = 409;
  constructor(public readonly email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}

export class InvalidCredentialsError extends DomainError {
  readonly code = IAM_ERROR_CODES.INVALID_CREDENTIALS;
  readonly statusCode = 401;
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailNotVerifiedError extends DomainError {
  readonly code = IAM_ERROR_CODES.EMAIL_NOT_VERIFIED;
  readonly statusCode = 404;
  constructor(public readonly email: string) {
    super(`Email ${email} is not verified`);
    this.name = 'EmailNotVerifiedError';
  }
}

export class EmailAlreadyVerifiedError extends DomainError {
  readonly code = IAM_ERROR_CODES.EMAIL_ALREADY_VERIFIED;
  readonly statusCode = 400;
  constructor(public readonly email: string) {
    super(`Email ${email} already verified`);
    this.name = 'EmailAlreadyVerifiedError';
  }
}

export class AccountNotFoundError extends DomainError {
  readonly code = IAM_ERROR_CODES.ACCOUNT_NOT_FOUND;
  readonly statusCode = 404;
  constructor(public readonly provider: string, public readonly subject: string) {
    super(`Account not found: ${provider}/${subject}`);
    this.name = 'AccountNotFoundError';
  }

  static byAccountId(accountId: string) {
    return new AccountNotFoundError('unknown', accountId);
  }
}

export class AccountAlreadyExistsError extends DomainError {
  readonly code = IAM_ERROR_CODES.ACCOUNT_ALREADY_EXISTS;
  readonly statusCode = 409;
  constructor(public readonly provider: string, public readonly subject: string) {
    super(`Account ${provider}/${subject} already exists`);
    this.name = 'AccountAlreadyExistsError';
  }
}

export class UserNotFoundError extends DomainError {
  readonly code = IAM_ERROR_CODES.USER_NOT_FOUND;
  readonly statusCode = 404;
  constructor(public readonly userId: string) {
    super(`User ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidEmailFormatError extends DomainError {
  readonly code = IAM_ERROR_CODES.INVALID_EMAIL_FORMAT;
  readonly statusCode = 400;
  constructor(public readonly email: string) {
    super(`Invalid email format: ${email}`);
    this.name = 'InvalidEmailFormatError';
  }
}

export class InvalidPasswordError extends DomainError {
  readonly code = IAM_ERROR_CODES.INVALID_PASSWORD;
  readonly statusCode = 400;
  constructor(reason: string) {
    super(`Invalid password: ${reason}`);
    this.name = 'InvalidPasswordError';
  }
}

export class ProviderNotSupportedError extends DomainError {
  readonly code = IAM_ERROR_CODES.PROVIDER_NOT_SUPPORTED;
  readonly statusCode = 400;
  constructor(public readonly provider: string) {
    super(`Provider ${provider} is not supported`);
    this.name = 'ProviderNotSupportedError';
  }
}

export class CaptchaValidationError extends DomainError {
  readonly code = IAM_ERROR_CODES.CAPTCHA_VALIDATION_FAILED;
  readonly statusCode = 400;
  constructor(reason?: string) {
    super(`Captcha validation failed${reason ? `: ${reason}` : ''}`);
    this.name = 'CaptchaValidationError';
  }
}

export class InvalidTokenError extends DomainError {
  readonly code = IAM_ERROR_CODES.INVALID_TOKEN;
  readonly statusCode = 401;
  constructor(reason?: string) {
    super(`Invalid token${reason ? `: ${reason}` : ''}`);
    this.name = 'InvalidTokenError';
  }
}