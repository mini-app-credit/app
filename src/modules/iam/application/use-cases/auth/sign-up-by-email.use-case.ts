import { Logger } from '@nestjs/common';
import { HashService } from '../../../../../shared/core/application/services/hash.service';
import { EventPublisher } from '../../../../../shared/core/application/services/event-publisher.service';
import { UUIDIdentifier } from '../../../../../shared/core/domain/value-objects/identifier.vo';
import { Account, AccountsRepository, AccountSubject, Provider, User, UserAlreadyExistsError, UserSignUpEvent, UsersRepository } from 'src/modules/iam/domain';
import { SignUpByEmailInput, SignUpByEmailOutput } from '../../dtos';
import { Result, UnitOfWork, UseCase } from 'src/shared';
import { InvokeEmailVerification } from './invoke-email-verification.use-case';

export type SignUpByEmail = UseCase<SignUpByEmailInput, Result<SignUpByEmailOutput>>;

export class SignUpByEmailUseCase implements SignUpByEmail {
  private readonly logger = new Logger(SignUpByEmailUseCase.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly hashService: HashService,
    private readonly eventPublisher: EventPublisher,
    private readonly unitOfWork: UnitOfWork,
    private readonly invokeEmailVerification: InvokeEmailVerification,
  ) { }

  async execute(input: SignUpByEmailInput): Promise<Result<SignUpByEmailOutput>> {
    try {
      const provider = Provider.password();
      const subject = AccountSubject.fromEmail(input.email);

      // Check if account already exists
      const existingAccount = await this.accountsRepository.findByProviderSubject(
        provider,
        subject,
      );

      if (existingAccount) {
        return [new UserAlreadyExistsError(input.email), null];
      }

      const user = User.create({
        unitAmount: 0,
        accounts: [],
      });

      // Set default credits
      user.updateCredits(10000);

      // Hash password
      const passwordHash = await this.hashService.hash(input.password);

      // Create domain entities
      const account = Account.createPassword({
        userId: UUIDIdentifier.create(user.id.toString()),
        subject: subject,
      });

      account.updateMeta({
        password: {
          hash: passwordHash,
        }
      });

      user.addAccount(account);

      // save
      const result = await this.unitOfWork.withTransaction(async (repos) => {
        const userRepository = repos.get(this.usersRepository.constructor.name) as UsersRepository;
        const accountRepository = repos.get(this.accountsRepository.constructor.name) as AccountsRepository;

        const savedUser = await userRepository.insert([user]);
        const savedAccount = await accountRepository.insert([account]);

        return {
          user: savedUser[0],
          account: savedAccount[0],
        };
      });

      const userSignUpEvent = new UserSignUpEvent(result.user.id.toString(), {
        userId: result.user.id.toString(),
        email: result.account.subject.asString,
        provider: result.account.provider.asString,
        createdAt: result.user.createdAt,
      });

      await this.eventPublisher.publish(userSignUpEvent);

      const [verifyErr] = await this.invokeEmailVerification.execute({ email: input.email });
      if (verifyErr) {
        this.logger.warn(
          { err: verifyErr, email: input.email },
          'Sign-up succeeded but verification email was not sent',
        );
      }

      return [null, null];
    } catch (error) {
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
