import { Attest } from "../../domain";

export interface AttestCreateProps {
  expiresAt: Date;
  payload: Record<string, any>;
}

/**
 * Abstract Attest Service for email verification token lifecycle
 * Infrastructure layer will implement with Redis backend (TTL 24h per Phase C context_log.md)
 */
export interface AttestService {
  /**
   * Issue email verification token
   * @param data Payload to attest (e.g., userId, accountId)
   * @returns Attest entity
   */
  issue(data: AttestCreateProps): Promise<Attest>;

  /**
   * Verify and decode email verification token
   * @param token Token to verify
   * @returns Payload if valid, null if expired/invalid
   */
  verify(token: string): Promise<Attest | null>;

  /**
   * Revoke email verification token (optional, for invalidation)
   * @param token Token to revoke
   */
  revoke(token: string): Promise<void>;
}
