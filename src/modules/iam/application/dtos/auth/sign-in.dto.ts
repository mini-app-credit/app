export interface SignInByEmailInput {
  email: string;
  password: string;
}

export interface SignInByEmailOutput {
  access: {
    token: string;
    expiresAt: Date;
  }
  refresh?: {
    token: string;
    expiresAt: Date;
  };
}
