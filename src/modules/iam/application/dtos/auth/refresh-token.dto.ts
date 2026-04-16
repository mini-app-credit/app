export interface RefreshTokenInput {
  userId: string;
  accountId: string;
  jti: string;
  email: string;
  provider: string;
}

export interface RefreshTokenOutput {
  access: {
    token: string;
    expiresAt: Date;
  }
  refresh?: {
    token: string;
    expiresAt: Date;
  };
}
