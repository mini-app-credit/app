import { BaseRepository, Database, PostgresTransaction, users, UUIDIdentifier } from "src/shared";
import { User, UsersRepository } from "../../domain";
import { UserMapper } from "../../application/mappers";
import { eq } from "drizzle-orm";

export class UsersRepositoryImpl implements UsersRepository {
  constructor(private readonly db: Database | PostgresTransaction) { }

  bind(tx: PostgresTransaction): BaseRepository<User> {
    return new UsersRepositoryImpl(tx);
  }

  private readonly table = users;

  async findById(id: UUIDIdentifier): Promise<User | null> {
    const condition = eq(users.id, id.toString());

    const user = await this.db.query.users.findFirst({ where: condition, with: { accounts: true } });

    if (!user) return null;

    return UserMapper.toDomain(user);
  }

  async insert(users: User[]): Promise<User[]> {
    const rows = users.map(user => UserMapper.toDto(user));

    const result = await this.db.insert(this.table).values(rows).returning();

    return result.map(UserMapper.toDomain);
  }

  async updateById(id: UUIDIdentifier, updates: User): Promise<User> {
    const row = UserMapper.toDto(updates);

    const condition = eq(users.id, id.toString());

    const result = await this.db.update(this.table).set(row).where(condition).returning();

    if (!result.length) {
      throw new Error('Failed to update user');
    }

    const updatedUser = await this.db.query.users.findFirst({ 
      where: condition, 
      with: { accounts: true } 
    });

    if (!updatedUser) {
      throw new Error('Failed to fetch updated user');
    }

    return UserMapper.toDomain(updatedUser);
  }
}