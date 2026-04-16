import { BaseRepository, UUIDIdentifier } from "src/shared";
import { User } from "../aggregates/user.aggregate";

export interface UsersRepository extends BaseRepository<User> {
  /**
   * Find user by ID
   * @param id User UUID
   * @returns User or null if not found
   */
  findById(id: UUIDIdentifier): Promise<User | null>;

  /**
   * Create a new user
   * @param data User creation data (unit_amount, createdAt, updatedAt)
   * @returns Created user
   */
  insert(users: User[]): Promise<User[]>;

  /**
   * Update user by ID
   * @param id User UUID
   * @param updates Updated user entity
   * @returns Updated user
   */
  updateById(id: UUIDIdentifier, updates: User): Promise<User>;
}
