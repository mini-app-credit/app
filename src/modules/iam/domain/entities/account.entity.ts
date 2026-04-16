import { Provider } from '../value-objects/provider.vo';
import { AccountSubject } from '../value-objects/account-subject.vo';
import { AccountMeta, AccountMetaProps } from '../value-objects';
import { BaseEntity, EntityProps, UUIDIdentifier } from 'src/shared';

export interface AccountProps extends EntityProps {
  id: UUIDIdentifier;
  userId: UUIDIdentifier;
  provider: Provider;
  subject: AccountSubject;
  meta: AccountMeta;
  verifiedAt: Date | null;
}

export type AccountCreatePasswordProps = Omit<AccountProps, 'id' | 'createdAt' | 'updatedAt' | 'provider' | 'meta' | 'verifiedAt'>;

export type AccountCreateOAuthProps = Omit<AccountProps, 'id' | 'createdAt' | 'updatedAt' | 'meta' | 'verifiedAt'>;

export class Account extends BaseEntity<AccountProps> {
  private constructor(props: AccountProps) {
    super(props);
  }

  get userId(): UUIDIdentifier {
    return this.props.userId;
  }

  get provider(): Provider {
    return this.props.provider;
  }

  get subject(): AccountSubject {
    return this.props.subject;
  }

  get meta(): AccountMeta {
    return this.props.meta;
  }

  get verifiedAt(): Date | null {
    return this.props.verifiedAt;
  }

  static createPassword(props: AccountCreatePasswordProps): Account {
    const now = new Date();
    return new Account({
      id: UUIDIdentifier.generate(),
      userId: props.userId,
      provider: Provider.password(),
      subject: props.subject,
      meta: AccountMeta.create({}),
      verifiedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Create OAuth account
   */
  static createOAuth(props: AccountCreateOAuthProps): Account {
    const now = new Date();
    return new Account({
      id: UUIDIdentifier.generate(),
      userId: props.userId,
      provider: props.provider,
      subject: props.subject,
      meta: AccountMeta.create({}),
      verifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(data: AccountProps): Account {
    return new Account(data);
  }

  isEmailVerified(): boolean {
    return !!this.props.verifiedAt;
  }

  isPasswordProvider(): boolean {
    return this.props.provider.isPassword();
  }

  isOAuthProvider(): boolean {
    return this.props.provider.isOAuth();
  }

  markEmailVerified(): void {
    const now = new Date();
    this._props.verifiedAt = now;
    this.markAsUpdated();
  }

  updateMeta(meta: AccountMetaProps): void {
    this._props.meta = AccountMeta.create({ ...this._props.meta.value, ...meta });
    this.markAsUpdated();
  }

  toPersistence(): AccountProps {
    return {
      id: this.props.id,
      userId: this.props.userId,
      provider: this.props.provider,
      subject: this.props.subject,
      meta: this.props.meta,
      verifiedAt: this.props.verifiedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  equals(account: Account): boolean {
    return this.id === account.id && this.provider === account.provider && this.subject === account.subject;
  }

  static restore(props: AccountProps): Account {
    return new Account(props);
  }

  protected validate(): void {
    if (!this.props.id) throw new Error('Account id is required');
    if (!this.props.userId) throw new Error('Account userId is required');
    if (!this.props.provider) throw new Error('Account provider is required');
    if (!this.props.subject) throw new Error('Account subject is required');
    if (!this.props.meta) throw new Error('Account meta is required');
  }
}
