export interface ResetPasswordInput {
  token: string;
  email: string;
  newPassword: string;
}

export type ResetPasswordOutput = null;
