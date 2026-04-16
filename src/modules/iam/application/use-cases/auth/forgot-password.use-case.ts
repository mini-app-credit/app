import { ForgotPasswordInput, ForgotPasswordOutput } from '../../dtos';
import { Result, UseCase } from 'src/shared';
import { AccountNotFoundError, AccountSubject, AccountsRepository, PasswordResetRequestedEvent, Provider } from 'src/modules/iam/domain';
import { AttestService } from '../../../../../shared/core/application/services/attest.service';
import { EventPublisher } from '../../../../../shared/core/application/services/event-publisher.service';

export type ForgotPassword = UseCase<ForgotPasswordInput, Result<ForgotPasswordOutput>>;

export class ForgotPasswordUseCase implements ForgotPassword {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly attestService: AttestService,
    private readonly eventPublisher: EventPublisher,
  ) { }

  private readonly ATTEST_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours

  async execute(input: ForgotPasswordInput): Promise<Result<ForgotPasswordOutput>> {
    try {
      const provider = Provider.password();

      const account = await this.accountsRepository.findByProviderSubject(provider, AccountSubject.fromEmail(input.email));

      if (!account) {
        return [new AccountNotFoundError(provider.asString, input.email), null];
      }

      if (!account.isPasswordProvider()) {
        return [new AccountNotFoundError(provider.asString, input.email), null];
      }

      const expiresAt = new Date(Date.now() + this.ATTEST_EXPIRATION_TIME);

      const issuedAttest = await this.attestService.issue({
        expiresAt,
        payload: {
          userId: account.userId.toString(),
          accountId: account.id.toString(),
        },
      });

      const passwordResetRequestedEvent = new PasswordResetRequestedEvent(
        account.userId.toString(),
        {
          userId: account.userId.toString(),
          accountId: account.id.toString(),
          email: account.subject.asString,
          code: {
            value: issuedAttest.value,
            expiresAt: issuedAttest.expiresAt,
          },
        },
      );

      await this.eventPublisher.publish(passwordResetRequestedEvent);

      return [null, null];
    } catch (error) {
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
