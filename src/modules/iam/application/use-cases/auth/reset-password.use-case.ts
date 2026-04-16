import { ResetPasswordInput, ResetPasswordOutput } from '../../dtos';
import { Result, UseCase, UUIDIdentifier } from 'src/shared';
import { AccountNotFoundError, AccountsRepository, IAMAttest, InvalidCredentialsError, InvalidTokenError, PasswordResetCompletedEvent } from 'src/modules/iam/domain';
import { AttestService } from '../../../../../shared/core/application/services/attest.service';
import { HashService } from '../../../../../shared/core/application/services/hash.service';
import { EventPublisher } from '../../../../../shared/core/application/services/event-publisher.service';

export type ResetPassword = UseCase<ResetPasswordInput, Result<ResetPasswordOutput>>;

export class ResetPasswordUseCase implements ResetPassword {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly attestService: AttestService,
    private readonly hashService: HashService,
    private readonly eventPublisher: EventPublisher,
  ) { }

  async execute(input: ResetPasswordInput): Promise<Result<ResetPasswordOutput>> {
    try {
      const baseAttest = await this.attestService.verify(input.token);

      if (!baseAttest) {
        return [new InvalidTokenError(), null];
      }

      const attest = IAMAttest.restore(baseAttest.toObject());

      if (!attest || !attest.payload.accountId) {
        return [new InvalidTokenError(), null];
      }

      const account = await this.accountsRepository.findById(UUIDIdentifier.create(attest.accountId));

      if (!account) {
        return [new AccountNotFoundError('password', 'unknown'), null];
      }

      if (account.subject.asString !== input.email) {
        return [new InvalidCredentialsError(), null];
      }

      if (!account.isPasswordProvider()) {
        return [new InvalidCredentialsError(), null];
      }

      // Hash new password
      const passwordHash = await this.hashService.hash(input.newPassword);

      // Update password in metadata
      account.updateMeta({
        password: {
          hash: passwordHash,
        },
      });

      // Update account in repository
      await this.accountsRepository.updateById(UUIDIdentifier.create(account.id.toString()), account);

      // Revoke token after use
      await this.attestService.revoke(attest.value);

      const passwordResetCompletedEvent = new PasswordResetCompletedEvent(
        account.userId.toString(),
        {
          userId: account.userId.toString(),
          accountId: account.id.toString(),
          email: account.subject.asString,
        },
      );

      // Publish event
      await this.eventPublisher.publish(passwordResetCompletedEvent);

      return [null, null];
    } catch (error) {
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
