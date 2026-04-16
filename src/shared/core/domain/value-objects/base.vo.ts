import { ValidationError } from '../errors/validation.error';

/**
 * Base value object class following DDD patterns
 */
export abstract class BaseValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this.validate(value);
    this._value = value;
  }

  /**
   * Get the value
   */
  get value(): T {
    return this._value;
  }

  /**
   * Validate the value (to be implemented by subclasses)
   */
  protected abstract validate(value: T): void;

  /**
   * Check equality with another value object
   */
  public equals(other: BaseValueObject<T>): boolean {
    if (!(other instanceof this.constructor)) {
      return false;
    }

    return this.isEqual(this._value, other._value);
  }

  /**
   * Deep equality check
   */
  private isEqual(a: any, b: any): boolean {
    if (a === b) {
      return true;
    }

    if (a == null || b == null) {
      return a === b;
    }

    if (typeof a !== typeof b) {
      return false;
    }

    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) {
        return false;
      }

      return keysA.every(key => this.isEqual(a[key], b[key]));
    }

    return false;
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    return String(this._value);
  }

  /**
   * Convert to JSON representation
   */
  public toJSON(): T {
    return this._value;
  }

  /**
   * Create validation error for this value object
   */
  protected createValidationError(message: string, field?: string): ValidationError {
    return field
      ? ValidationError.forField(field, message)
      : new ValidationError(message);
  }
}