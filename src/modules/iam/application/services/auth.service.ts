import { Token } from "../../domain";

export interface TokenPair {
  accessToken: Token;
  refreshToken: Token;
}

export interface AuthServiceContext {
  userId: string;
  accountId: string;
  email: string;
  provider: string;
}

/**
 * Application Service for authentication token generation
 * Centralizes token pair creation logic (access + refresh tokens)
 * Follows DDD: stateless service for cross-cutting concerns
 */
export interface AuthService {
  /**
   * Issue access and refresh token pair
   * @param context User context with userId, email, provider
   * @returns Token pair with access (15m) and refresh (7d) tokens
   */
  issueTokenPair(context: AuthServiceContext): Promise<TokenPair>;

  /**
   * Issue new access token from refresh token claims
   * @param context User context extracted from refresh token
   * @returns New access token
   */
  issueAccessToken(context: AuthServiceContext): Promise<Token>;

  /**
   * Issue refresh token with jti (JWT ID) for tracking
   * @param context User context with userId, email, provider
   * @returns Refresh token with embedded jti
   */
  issueRefreshToken(context: AuthServiceContext): Promise<Token>;
}
