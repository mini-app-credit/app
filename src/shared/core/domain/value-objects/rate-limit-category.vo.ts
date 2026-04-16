import { BaseValueObject } from "./base.vo";

export const RATE_LIMIT_CATEGORY = {
  PUBLIC: 'public',
  AUTH_SENSITIVE: 'auth-sensitive',
  AUTHENTICATED: 'authenticated',
  MCP_USER: 'mcp-user',
  MCP_TOOL: 'mcp-tool',
} as const;

export type RateCategory = (typeof RATE_LIMIT_CATEGORY)[keyof typeof RATE_LIMIT_CATEGORY];

export class RateLimitCategory extends BaseValueObject<RateCategory> {
  constructor(value: RateCategory) {
    super(value);
  }

  protected validate(value: RateCategory): void {
    if (!RateLimitCategory.isValid(value)) {
      throw this.createValidationError('Invalid rate limit category', 'RateLimitCategory');
    }
  }

  static create(value: RateCategory): RateLimitCategory {
    return new RateLimitCategory(value);
  }

  static isValid(value: RateCategory): boolean {
    return Object.values(RATE_LIMIT_CATEGORY).includes(value);
  }

  get asString(): RateCategory {
    return this.value;
  }

  equals(other: RateLimitCategory): boolean {
    return this.asString === other.asString;
  }

  toString(): RateCategory {
    return this.asString;
  }

  toValue(): RateCategory {
    return this.asString;
  }

  isPublic(): boolean {
    return this.asString === RATE_LIMIT_CATEGORY.PUBLIC;
  }

  isAuthSensitive(): boolean {
    return this.asString === RATE_LIMIT_CATEGORY.AUTH_SENSITIVE;
  }

  isAuthenticated(): boolean {
    return this.asString === RATE_LIMIT_CATEGORY.AUTHENTICATED;
  }

  isMcpUser(): boolean {
    return this.asString === RATE_LIMIT_CATEGORY.MCP_USER;
  }

  isMcpTool(): boolean {
    return this.asString === RATE_LIMIT_CATEGORY.MCP_TOOL;
  }
}