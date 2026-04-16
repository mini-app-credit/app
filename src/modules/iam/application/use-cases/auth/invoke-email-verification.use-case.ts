import { AttestService, Result, UseCase } from 'src/shared';
import { InvokeEmailVerificationInput, InvokeEmailVerificationOutput } from '../../dtos';
import { EventPublisher } from 'src/shared/core/application';
import { AccountNotFoundError, AccountsRepository, AccountSubject, EmailAlreadyVerifiedError, EmailVerificationEvent, InvalidCredentialsError, Provider } from 'src/modules/iam/domain';

export type InvokeEmailVerification = UseCase<InvokeEmailVerificationInput, Result<InvokeEmailVerificationOutput>>;

export class InvokeEmailVerificationUseCase implements InvokeEmailVerification {
  constructor(private readonly accountsRepository: AccountsRepository, private readonly attestService: AttestService, private readonly eventPublisher: EventPublisher) { }

  private readonly ATTEST_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

  async execute(input: InvokeEmailVerificationInput): Promise<Result<InvokeEmailVerificationOutput>> {
    try {
      const account = await this.accountsRepository.findByProviderSubject(Provider.password(), AccountSubject.fromEmail(input.email));

      if (!account) {
        return [new AccountNotFoundError('password', input.email), null];
      }

      if (!account.isPasswordProvider()) {
        return [new InvalidCredentialsError(), null];
      }

      if (account.isEmailVerified()) {
        return [new EmailAlreadyVerifiedError(account.subject.asString), null];
      }

      const expiresAt = new Date(Date.now() + this.ATTEST_EXPIRATION_TIME);

      const issuedAttest = await this.attestService.issue({
        expiresAt,
        payload: {
          userId: account.userId.toString(),
          accountId: account.id.toString(),
        },
      });

      const emailVerificationEvent = new EmailVerificationEvent(account.userId.toString(), {
        userId: account.userId.toString(),
        accountId: account.id.toString(),
        email: account.subject.asString,
        code: {
          value: issuedAttest.value,
          expiresAt: issuedAttest.expiresAt,
        },
      });

      await this.eventPublisher.publish(emailVerificationEvent);

      return [null, null];
    } catch (error) {
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}