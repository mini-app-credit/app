import { AccountNotFoundError, AccountsRepository, EmailAlreadyVerifiedError, EmailVerifiedEvent, IAMAttest, InvalidCredentialsError, InvalidTokenError } from 'src/modules/iam/domain';
import { AttestService } from '../../../../../shared/core/application/services/attest.service';
import { EventPublisher } from '../../../../../shared/core/application/services/event-publisher.service';
import { UUIDIdentifier } from '../../../../../shared/core/domain/value-objects/identifier.vo';
import { ConfirmEmailInput, ConfirmEmailOutput } from '../../dtos';
import { Result, UseCase } from 'src/shared';

export type ConfirmEmail = UseCase<ConfirmEmailInput, Result<ConfirmEmailOutput>>;

export class ConfirmEmailUseCase implements ConfirmEmail {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly attestService: AttestService,
    private readonly eventPublisher: EventPublisher,
  ) { }

  async execute(input: ConfirmEmailInput): Promise<Result<ConfirmEmailOutput>> {
    try {
      const baseAttest = await this.attestService.verify(input.token)

      if (!baseAttest) {
        return [new InvalidTokenError(), null];
      }

      const attest = IAMAttest.restore(baseAttest.toObject());

      if (!attest || !attest.payload.userId || !attest.payload.accountId) {
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

      if (account.isEmailVerified()) {
        return [new EmailAlreadyVerifiedError(account.subject.asString), null];
      }

      // Mark email verified
      account.markEmailVerified();

      // Update in repository
      await this.accountsRepository.updateById(UUIDIdentifier.create(account.id.toString()), account);

      // Revoke token after use
      await this.attestService.revoke(attest.value);

      const emailVerifiedEvent = new EmailVerifiedEvent(account.userId.toString(), {
        userId: account.userId.toString(),
        accountId: account.id.toString(),
        email: account.subject.asString,
        verifiedAt: account.verifiedAt || new Date(),
      });

      // Publish event
      await this.eventPublisher.publish(emailVerifiedEvent);
      return [null, null];
    } catch (error) {
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
