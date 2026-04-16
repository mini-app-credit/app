import { BaseRepository, UUIDIdentifier } from "src/shared";
import { Account } from "../entities";
import { AccountSubject, Provider } from "../value-objects";

export interface AccountsRepository extends BaseRepository<Account> {
  /**
   * Find account by provider and subject
   * @param provider Provider name (password, google, etc)
   * @param subject Email or OAuth provider ID
   * @returns Account or null if not found
   */
  findByProviderSubject(provider: Provider, subject: AccountSubject): Promise<Account | null>;

  /**
   * Find account by ID
   * @param id Account UUID
   * @returns Account or null if not found
   */
  findById(id: UUIDIdentifier): Promise<Account | null>;

  /**
   * Insert accounts
   * @param accounts Accounts to insert
   * @returns Inserted accounts
   */
  insert(accounts: Account[]): Promise<Account[]>;

  /**
   * Update account (generic, not business-logic-bound)
   * @param id Account ID
   * @param updates Partial updates
   * @returns Updated account
   */
  updateById(
    id: UUIDIdentifier,
    updates: Account,
  ): Promise<Account>;
}
