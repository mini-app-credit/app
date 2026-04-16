import { Injectable, Inject } from '@nestjs/common';
import { UserService, GetUserInput, CheckEmailVerifiedInput } from '../../application/services/user.service';
import { UsersRepository, User } from '../../domain';
import { UserNotFoundError, EmailNotVerifiedError } from '../../domain/errors';
import { IAM_DI_TOKENS } from '../constants';

@Injectable()
export class UserServiceImpl implements UserService {
  constructor(
    @Inject(IAM_DI_TOKENS.REPOSITORIES.USER)
    private readonly usersRepository: UsersRepository,
  ) { }

  async getUser(input: GetUserInput): Promise<User> {
    const user = await this.usersRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError(input.userId.toString());
    }

    return user;
  }

  async checkEmailVerified(input: CheckEmailVerifiedInput): Promise<void> {
    const user = await this.getUser({ userId: input.userId });

    const passwordAccount = user.accounts.find(acc => acc.isPasswordProvider());

    if (!passwordAccount || !passwordAccount.isEmailVerified()) {
      throw new EmailNotVerifiedError(input.userId.toString());
    }
  }
}
