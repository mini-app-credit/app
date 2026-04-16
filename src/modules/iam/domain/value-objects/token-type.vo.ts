import { BaseValueObject } from "src/shared";

export const TOKEN_TYPE = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export type TokenTypePrimitive = (typeof TOKEN_TYPE)[keyof typeof TOKEN_TYPE];

export class TokenType extends BaseValueObject<TokenTypePrimitive> {
  private constructor(value: TokenTypePrimitive) {
    super(value);
  }

  protected validate(value: TokenTypePrimitive): void {
    if (!Object.values(TOKEN_TYPE).includes(value)) {
      throw this.createValidationError(`Invalid token type: ${value}`, 'TokenType');
    }
  }

  static create(value: TokenTypePrimitive): TokenType {
    return new TokenType(value);
  }

  static access(): TokenType {
    return new TokenType(TOKEN_TYPE.ACCESS);
  }

  static refresh(): TokenType {
    return new TokenType(TOKEN_TYPE.REFRESH);
  }

  get asString(): TokenTypePrimitive {
    return this.value;
  }

  equals(other: TokenType): boolean {
    return this.asString === other.asString;
  }

  toString(): TokenTypePrimitive {
    return this.asString;
  }
}