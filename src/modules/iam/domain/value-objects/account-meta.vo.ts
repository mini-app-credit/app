import { BaseValueObject } from "src/shared";

export interface AccountPasswordMetaProps {
  hash: string;
}

export interface AccountMetaProps {
  password?: AccountPasswordMetaProps;
}

export class AccountMeta extends BaseValueObject<AccountMetaProps> {
  private constructor(value: AccountMetaProps) {
    super(value);
  }

  /**
   * Get the hash of the password
   */
  get passwordHash(): string | undefined {
    return this.value.password?.hash;
  }

  protected validate(value: AccountMetaProps): void {
    if (value.password) {
      if (!value.password.hash) {
        throw new Error('Password hash is required');
      }
    }
  }

  static create(props: AccountMetaProps): AccountMeta {
    return new AccountMeta(props);
  }

  toPersistence(): AccountMetaProps {
    return this.value;
  }
}