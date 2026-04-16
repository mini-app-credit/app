import { BaseValueObject } from 'src/shared';
import { InvalidEmailFormatError } from '../errors/iam.errors';

export type EmailPrimitive = string;

export class Email extends BaseValueObject<EmailPrimitive> {
  private constructor(value: EmailPrimitive) {
    super(value);
  }

  protected validate(value: EmailPrimitive): void {
    if (!Email.isValid(value)) {
      throw new InvalidEmailFormatError(value);
    }
  }

  static create(email: EmailPrimitive): Email {
    return new Email(email.toLowerCase().trim());
  }

  private static isValid(email: EmailPrimitive): boolean {
    // RFC 5321 simplified regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  get asString(): EmailPrimitive {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.asString === other.asString;
  }

  toString(): EmailPrimitive {
    return this.asString;
  }
}
