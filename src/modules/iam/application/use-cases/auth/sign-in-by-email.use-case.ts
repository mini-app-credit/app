import { HashService } from '../../../../../shared/core/application/services/hash.service';
import { EventPublisher } from '../../../../../shared/core/application/services/event-publisher.service';
import { Result, UseCase } from '../../../../../shared';
import { SignInByEmailInput, SignInByEmailOutput } from '../../dtos';
import { AccountNotFoundError, AccountsRepository, AccountSubject, EmailNotVerifiedError, InvalidCredentialsError, Provider, UserLoggedInEvent } from 'src/modules/iam/domain';
import { AuthService } from '../../services';

export type SignInByEmail = UseCase<SignInByEmailInput, Result<SignInByEmailOutput>>;

export class SignInByEmailUseCase implements SignInByEmail {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly hashService: HashService,
    private readonly authService: AuthService,
    private readonly eventPublisher: EventPublisher,
  ) { }

  async execute(input: SignInByEmailInput): Promise<Result<SignInByEmailOutput>> {
    try {
      const provider = Provider.password();
      // Find account by email
      const account = await this.accountsRepository.findByProviderSubject(provider, AccountSubject.fromEmail(input.email));

      if (!account) {
        return [new AccountNotFoundError(provider.asString, input.email), null];
      }

      if (!account.isPasswordProvider()) {
        return [new InvalidCredentialsError(), null];
      }

      // Check if email verified
      if (!account.isEmailVerified()) {
        return [new EmailNotVerifiedError(account.subject.asString), null];
      }

      // Verify password
      const passwordValid = await this.hashService.verify(
        input.password,
        account.meta.passwordHash || '',
      );

      if (!passwordValid) {
        return [new InvalidCredentialsError(), null];
      }

      const now = new Date();

      // Generate tokens using AuthService
      const { accessToken, refreshToken } = await this.authService.issueTokenPair({
        userId: account.userId.toValue(),
        accountId: account.id.toString(),
        email: account.subject.asString,
        provider: account.provider.asString,
      });

      // Publish event
      const userLoggedInEvent = new UserLoggedInEvent(account.userId.toValue(), {
        userId: account.userId.toValue(),
        email: account.subject.asString,
        provider: account.provider.asString,
        loginAt: now,
      });

      await this.eventPublisher.publish(userLoggedInEvent);

      return [null, { access: { token: accessToken.value, expiresAt: accessToken.expiresAt }, refresh: { token: refreshToken.value, expiresAt: refreshToken.expiresAt } }];
    } catch (error) {
      return [error, null];
    }
  }
}
