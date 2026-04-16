import { DomainError } from 'src/shared';

export const NOTIFICATIONS_ERROR_CODES = {
  TEMPLATE_NOT_FOUND: 60001,
  TEMPLATE_RENDER_FAILED: 60002,
  EMAIL_SEND_FAILED: 60003,
  TEMPLATES_SERVICE_UNAVAILABLE: 60004,
  TEMPLATE_ALREADY_EXISTS: 60005,
  INVALID_EMAIL_TEMPLATE: 60006,
} as const;

export class TemplateNotFoundError extends DomainError {
  readonly code = NOTIFICATIONS_ERROR_CODES.TEMPLATE_NOT_FOUND;
  readonly statusCode = 404;

  constructor(public readonly templateIdOrEventName: string) {
    super(`Email template not found: ${templateIdOrEventName}`);
    this.name = 'TemplateNotFoundError';
  }
}

export class TemplateRenderFailedError extends DomainError {
  readonly code = NOTIFICATIONS_ERROR_CODES.TEMPLATE_RENDER_FAILED;
  readonly statusCode = 500;

  constructor(public readonly templatePath: string, reason?: string) {
    super(`Failed to render template ${templatePath}${reason ? `: ${reason}` : ''}`);
    this.name = 'TemplateRenderFailedError';
  }
}

export class EmailSendFailedError extends DomainError {
  readonly code = NOTIFICATIONS_ERROR_CODES.EMAIL_SEND_FAILED;
  readonly statusCode = 502;

  constructor(public readonly recipient: string, reason?: string) {
    super(`Failed to send email to ${recipient}${reason ? `: ${reason}` : ''}`);
    this.name = 'EmailSendFailedError';
  }
}

export class TemplatesServiceUnavailableError extends DomainError {
  readonly code = NOTIFICATIONS_ERROR_CODES.TEMPLATES_SERVICE_UNAVAILABLE;
  readonly statusCode = 503;

  constructor(reason?: string) {
    super(`Templates service unavailable${reason ? `: ${reason}` : ''}`);
    this.name = 'TemplatesServiceUnavailableError';
  }
}

export class TemplateAlreadyExistsError extends DomainError {
  readonly code = NOTIFICATIONS_ERROR_CODES.TEMPLATE_ALREADY_EXISTS;
  readonly statusCode = 409;

  constructor(public readonly eventName: string) {
    super(`Template already exists for event ${eventName}`);
    this.name = 'TemplateAlreadyExistsError';
  }
}

export class InvalidEmailTemplateError extends DomainError {
  readonly code = NOTIFICATIONS_ERROR_CODES.INVALID_EMAIL_TEMPLATE;
  readonly statusCode = 400;

  constructor(reason: string) {
    super(`Invalid email template: ${reason}`);
    this.name = 'InvalidEmailTemplateError';
  }
}
