import { AggregateRoot, EntityProps, UUIDIdentifier } from 'src/shared';
import { Account } from '../entities/account.entity';
import { AccountAlreadyExistsError } from '../errors/iam.errors';
import { AccountSubject, Provider } from '../value-objects';

export interface UserProps extends EntityProps {
  id: UUIDIdentifier;
  unitAmount: number;
  accounts: Account[];
  createdAt: Date;
  updatedAt: Date;
}

export type UserCreateProps = Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>;

export class User extends AggregateRoot<UserProps> {
  constructor(props: UserProps) {
    super(props);
  }

  get unitAmount(): number {
    return this.props.unitAmount;
  }

  get accounts(): Account[] {
    return this.props.accounts;
  }

  static create(props: UserCreateProps): User {
    const now = new Date();
    return new User({
      id: UUIDIdentifier.generate(),
      unitAmount: props.unitAmount,
      accounts: props.accounts,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(data: UserProps): User {
    return new User(data);
  }

  updateCredits(newAmount: number): void {
    this._props.unitAmount = newAmount;
    this.markAsUpdated();
  }

  addAccount(account: Account): void {
    // Check if account already exists
    const accountIndex = this.props.accounts.findIndex(a => a.equals(account));
    // If account already exists, throw an error
    if (accountIndex !== -1) {
      throw new AccountAlreadyExistsError(account.provider.toString(), account.subject.toString());
    }

    this.props.accounts.push(account);
    this.markAsUpdated();
  }

  findAccountByProviderSubject(provider: Provider, subject: AccountSubject): Account | null {
    // Find account by provider and subject
    const accountIndex = this.props.accounts.findIndex(a => a.provider.equals(provider) && a.subject.equals(subject));

    if (accountIndex === -1) {
      return null;
    }

    return this.props.accounts[accountIndex];
  }

  protected validate(): void {
    if (this.id.value.length === 0) {
      throw new Error('User id is required');
    }
  }
}
