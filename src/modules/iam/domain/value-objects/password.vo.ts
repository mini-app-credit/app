import { BaseValueObject } from 'src/shared';
import { InvalidPasswordError } from '../errors/iam.errors';

export type PasswordPrimitive = string;

export class Password extends BaseValueObject<PasswordPrimitive> {
  private constructor(value: PasswordPrimitive) {
    super(value);
  }

  protected validate(value: PasswordPrimitive): void {
    if (!Password.isValid(value)) {
      throw new InvalidPasswordError(value);
    }
  }

  private static isValid(password: PasswordPrimitive): boolean {
    // Min 8 chars, per Phase C context_log.md
    return !!password && password.length >= 8;
  }

  get asPlainText(): PasswordPrimitive {
    return this.value;
  }

  toString(): PasswordPrimitive {
    return '***REDACTED***';
  }
}
