import { accounts, BaseRepository, Database, PostgresTransaction, UUIDIdentifier } from "src/shared";
import { Account, AccountsRepository, AccountSubject, Provider } from "../../domain";
import { and, eq } from "drizzle-orm";
import { AccountMapper } from "../../application/mappers";

export class AccountRepositoryImpl implements AccountsRepository {
  constructor(private readonly db: Database | PostgresTransaction) { }

  bind(tx: PostgresTransaction): BaseRepository<Account> {
    return new AccountRepositoryImpl(tx);
  }

  private readonly table = accounts;

  async findByProviderSubject(provider: Provider, subject: AccountSubject): Promise<Account | null> {
    const condition = and(eq(accounts.provider, provider.asString), eq(accounts.subject, subject.asString));

    const account = await this.db.query.accounts.findFirst({ where: condition });

    if (!account) return null;

    return AccountMapper.toDomain(account);
  }

  async findById(id: UUIDIdentifier): Promise<Account | null> {
    const condition = eq(accounts.id, id.toString());

    const account = await this.db.query.accounts.findFirst({ where: condition });

    if (!account) return null;

    return AccountMapper.toDomain(account);
  }

  async insert(accounts: Account[]): Promise<Account[]> {
    const rows = accounts.map(account => AccountMapper.toDto(account));

    const result = await this.db.insert(this.table).values(rows).returning();

    return result.map(AccountMapper.toDomain);
  }

  async updateById(id: UUIDIdentifier, updates: Account): Promise<Account> {
    const row = AccountMapper.toDto(updates);

    const condition = eq(accounts.id, id.toString());

    const result = await this.db.update(this.table).set(row).where(condition).returning();

    if (!result.length) throw new Error('Failed to update account');

    return AccountMapper.toDomain(result[0]);
  }
}