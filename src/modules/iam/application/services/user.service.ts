import { UUIDIdentifier } from 'src/shared';
import { User } from '../../domain';

export interface GetUserInput {
  userId: UUIDIdentifier;
}

export interface GetUserOutput {
  user: User;
}

export interface CheckEmailVerifiedInput {
  userId: UUIDIdentifier;
}

export interface UserService {
  getUser(input: GetUserInput): Promise<User>;

  checkEmailVerified(input: CheckEmailVerifiedInput): Promise<void>;
}
