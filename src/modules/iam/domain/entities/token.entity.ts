import { BaseEntity, EntityProps, JWTToken, UUIDIdentifier } from "src/shared";
import { TokenType } from "../value-objects";

export interface TokenProps extends EntityProps {
  id: UUIDIdentifier;
  userId: UUIDIdentifier;
  accountId: UUIDIdentifier;
  type: TokenType;
  value: JWTToken;
  expiresAt: Date;
}

export type TokenCreateProps = Omit<TokenProps, 'createdAt' | 'updatedAt'>;

export class Token extends BaseEntity<TokenProps> {
  private constructor(props: TokenProps) {
    super(props);
  }

  get userId(): UUIDIdentifier {
    return this.props.userId;
  }

  get accountId(): UUIDIdentifier {
    return this.props.accountId;
  }

  get type(): TokenType {
    return this.props.type;
  }

  get value(): JWTToken {
    return this.props.value;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  static create(props: TokenCreateProps): Token {
    const now = new Date();

    return new Token({
      id: props.id,
      userId: props.userId,
      accountId: props.accountId,
      type: props.type,
      value: props.value,
      expiresAt: props.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  isRefresh(): boolean {
    return this.type.equals(TokenType.refresh());
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  static restore(props: TokenProps): Token {
    return new Token(props);
  }

  equals(other: Token): boolean {
    return this.id === other.id;
  }

  protected validate(): void {
    if (!this.props.id) throw new Error('Token id is required');
    if (!this.props.userId) throw new Error('Token userId is required');
    if (!this.props.accountId) throw new Error('Token accountId is required');
    if (!this.props.type) throw new Error('Token type is required');
    if (!this.props.value) throw new Error('Token value is required');
    if (!this.props.expiresAt) throw new Error('Token expiresAt is required');
  }
}