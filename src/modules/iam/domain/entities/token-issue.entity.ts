import { BaseEntity, EntityProps, JWTToken, UUIDIdentifier } from "src/shared";

export interface TokenIssueProps extends EntityProps {
  id: UUIDIdentifier;
  token: JWTToken;
  expiresAt: Date;
  scopes: string[];
}

export class TokenIssue extends BaseEntity<TokenIssueProps> {
  private constructor(props: TokenIssueProps) {
    super(props);
  }

  get token(): JWTToken {
    return this.props.token;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get scopes(): string[] {
    return this.props.scopes;
  }

  static create(props: { id: UUIDIdentifier; token: JWTToken; expiresAt: Date; scopes: string[] }): TokenIssue {
    const now = new Date();
    return new TokenIssue({
      id: props.id,
      token: props.token,
      expiresAt: props.expiresAt,
      scopes: props.scopes,
      createdAt: now,
      updatedAt: now,
    });
  }

  protected validate(): void {
    if (!this.props.id) throw new Error('TokenIssue id is required');
    if (!this.props.token) throw new Error('TokenIssue token is required');
    if (!this.props.expiresAt) throw new Error('TokenIssue expiresAt is required');
    if (!Array.isArray(this.props.scopes)) throw new Error('TokenIssue scopes is required');
  }
}

