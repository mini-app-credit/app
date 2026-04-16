import { SignOutInput, SignOutOutput } from '../../dtos/auth/sign-out.dto';
import { Result, UseCase, UUIDIdentifier } from 'src/shared';
import { AccountNotFoundError, TokenRepository, UserNotFoundError, UsersRepository } from 'src/modules/iam/domain';
import { UserLoggedOutEvent } from 'src/modules/iam/domain';
import { EventPublisher } from 'src/shared/core/application/services/event-publisher.service';

export type SignOut = UseCase<SignOutInput, Result<SignOutOutput>>;

export class SignOutUseCase implements SignOut {
  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly userRepository: UsersRepository,
    private readonly eventPublisher: EventPublisher,
  ) { }

  async execute(input: SignOutInput): Promise<Result<SignOutOutput>> {
    try {
      // Find all refresh tokens for the user and delete them
      // Note: In a real implementation, we'd need to find tokens by userId
      // For now, we'll just emit the event as tokens are stateless

      const user = await this.userRepository.findById(UUIDIdentifier.create(input.userId));

      if (!user) {
        return [new UserNotFoundError(input.userId), null];
      }

      const accountIndex = user.accounts.findIndex(account => account.id.toString() === input.accountId);

      if (accountIndex === -1) {
        return [new AccountNotFoundError('unknown', input.accountId), null];
      }

      const account = user.accounts[accountIndex];

      await this.tokenRepository.deleteByAccountId(UUIDIdentifier.create(account.id.toString()));

      const userLoggedOutEvent = new UserLoggedOutEvent(
        input.userId,
        {
          userId: input.userId,
          logoutAt: new Date(),
        }
      );

      await this.eventPublisher.publish(userLoggedOutEvent);

      return [null, null];
    } catch (error) {
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
