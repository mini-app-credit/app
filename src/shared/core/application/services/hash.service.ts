/**
 * Abstract Hash Service for password hashing
 * Infrastructure layer will implement with argon2/bcrypt
 */
export interface HashService {
  /**
   * Hash plaintext password
   */
  hash(plaintext: string): Promise<string>;

  /**
   * Verify plaintext against hash
   */
  verify(plaintext: string, hash: string): Promise<boolean>;
}

