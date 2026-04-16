import { BaseValueObject } from './base.vo';

export class Increment extends BaseValueObject<number> {
  protected validate(value: number): void {
    if (value < 0) {
      throw this.createValidationError('Increment value must be greater than 0', 'Increment.value');
    }
  }

  static create(value: number): Increment {
    return new Increment(value);
  }

  increment(): Increment {
    return new Increment(this._value + 1);
  }
}