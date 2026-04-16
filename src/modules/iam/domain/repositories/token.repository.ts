import { UUIDIdentifier } from "src/shared";
import { Token } from "../entities";

export interface TokenRepository {
  /**
   * Find tokens by account ID
   * @param accountId Account UUID
   * @returns Tokens
   */
  findByAccountId(accountId: UUIDIdentifier): Promise<Token[]>;

  /**
   * Find single token by account ID and token ID
   * @param accountId Account UUID
   * @param tokenId Token ID (JTI)
   * @returns Token or null if not found
   */
  findByAccountIdAndId(accountId: UUIDIdentifier, tokenId: string): Promise<Token | null>;

  /**
   * Save tokens
   * @param tokens Tokens to save
   * @returns Saved tokens
   */
  save(tokens: Token[]): Promise<Token[]>;

  /**
   * Delete tokens by account ID
   * @param accountId Account UUID
   * @returns Deleted tokens
   */
  deleteByAccountId(accountId: UUIDIdentifier): Promise<void>;

  /**
   * Delete single token by account ID and token ID
   * @param accountId Account UUID
   * @param tokenId Token ID (JTI) as string
   */
  deleteByAccountIdAndId(accountId: UUIDIdentifier, tokenId: string): Promise<void>;
}