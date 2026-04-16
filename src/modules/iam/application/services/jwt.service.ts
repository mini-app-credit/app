/**
 * Abstract JWT Service for token generation and validation
 * Infrastructure layer will implement with jsonwebtoken
 */

export interface JwtPayload {
  [key: string]: unknown;
  iss?: string | undefined;
  sub?: string | undefined;
  aud?: string | string[] | undefined;
  exp?: number | undefined;
  nbf?: number | undefined;
  iat?: number | undefined;
  jti?: string | undefined;
}

export type JwtOptions = {
  expiresIn: number | `${number}${string}`;
  secret?: string;
};

export interface JwtService {
  /**
   * Generate JWT token
   */
  generate(payload: JwtPayload, options?: JwtOptions): Promise<string>;

  /**
   * Validate and decode JWT token
   */
  validate(token: string, options?: JwtOptions): Promise<JwtPayload | null>;
}
