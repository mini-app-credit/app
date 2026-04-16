import { Provider } from "@nestjs/common";
import { AccountRepositoryImpl, AuthServiceImpl, IAM_DI_TOKENS, JsonWebTokenService, JwtAccessStrategy, JwtConfig, JwtRefreshStrategy, loadJwtConfig, TokenRepositoryImpl, UsersRepositoryImpl, UserServiceImpl } from "../infrastructure";
import { AttestServiceImpl, BaseRepository, Database, EventPublisher, HashService, RedisService, SHARED_DI_TOKENS, UowDrizzle, TokenBucketRateLimitService, configs as rateLimitConfigs } from "src/shared";
import { ConfirmEmailUseCase, FindUserByIdUseCase, ForgotPasswordUseCase, InvokeEmailVerification, InvokeEmailVerificationUseCase, RefreshTokenUseCase, ResetPasswordUseCase, SignInByEmailUseCase, SignUpByEmailUseCase, SignOutUseCase } from "../application/use-cases";
import { AuthService, JwtService } from "../application/services";
import { AccountsRepository, TokenRepository, UsersRepository } from "../domain";

export const accountRepositoryProvider: Provider = {
  provide: IAM_DI_TOKENS.REPOSITORIES.ACCOUNT,
  useFactory: (database: Database) => new AccountRepositoryImpl(database),
  inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
};

export const tokenRepositoryProvider: Provider = {
  provide: IAM_DI_TOKENS.REPOSITORIES.TOKEN,
  useFactory: (redis: RedisService) => {
    return new TokenRepositoryImpl(redis.getClient())
  },
  inject: [SHARED_DI_TOKENS.REDIS_SERVICE],
};

export const userRepositoryProvider: Provider = {
  provide: IAM_DI_TOKENS.REPOSITORIES.USER,
  useFactory: (database: Database) => new UsersRepositoryImpl(database),
  inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
};

export const repositoryProviders: Provider[] = [accountRepositoryProvider, tokenRepositoryProvider, userRepositoryProvider];

const jwtConfigProvider: Provider = {
  provide: IAM_DI_TOKENS.CONFIGS.JWT,
  useValue: loadJwtConfig.from.env(process.env),
};

export const configProviders: Provider[] = [jwtConfigProvider];

const mcpJwtServiceProvider: Provider = {
  provide: IAM_DI_TOKENS.SERVICES.JWT,
  useFactory: (config: JwtConfig) => {
    return new JsonWebTokenService({
      secret: config.jwtSecret,
      defaultExpiresIn: config.jwtExpiresIn,
      algorithm: config.jwtAlgorithm,
    });
  },
  inject: [IAM_DI_TOKENS.CONFIGS.JWT],
};

export const mcpConfigProviders: Provider[] = [jwtConfigProvider];
export const mcpServiceProviders: Provider[] = [mcpJwtServiceProvider];


const jwtServiceProvider: Provider = {
  provide: IAM_DI_TOKENS.SERVICES.JWT,
  useFactory: (config: JwtConfig) => {
    return new JsonWebTokenService({
      secret: config.jwtSecret,
      defaultExpiresIn: config.jwtExpiresIn,
      algorithm: config.jwtAlgorithm,
    });
  },
  inject: [IAM_DI_TOKENS.CONFIGS.JWT],
};

const authServiceProvider: Provider = {
  provide: IAM_DI_TOKENS.SERVICES.AUTH,
  useFactory: (jwtService: JwtService, tokenRepository: TokenRepository) => {
    return new AuthServiceImpl(jwtService, tokenRepository);
  },
  inject: [IAM_DI_TOKENS.SERVICES.JWT, IAM_DI_TOKENS.REPOSITORIES.TOKEN],
};

const rateLimitServiceProvider: Provider = {
  provide: SHARED_DI_TOKENS.RATE_LIMIT_SERVICE,
  useFactory: (redisService: RedisService) => {
    return new TokenBucketRateLimitService(redisService.getClient(), rateLimitConfigs);
  },
  inject: [SHARED_DI_TOKENS.REDIS_SERVICE],
};

const userServiceProvider: Provider = {
  provide: IAM_DI_TOKENS.SERVICES.USER,
  useFactory: (usersRepository: UsersRepository) => {
    return new UserServiceImpl(usersRepository);
  },
  inject: [IAM_DI_TOKENS.REPOSITORIES.USER],
};

export const serviceProviders: Provider[] = [jwtServiceProvider, authServiceProvider, rateLimitServiceProvider, userServiceProvider];

const signUpByEmailUseCaseProvider: Provider = {
  provide: IAM_DI_TOKENS.USE_CASES.SIGN_UP_BY_EMAIL,
  useFactory: (
    usersRepository: UsersRepository,
    accountsRepository: AccountsRepository,
    hashService: HashService,
    eventPublisher: EventPublisher,
    database: Database,
    invokeEmailVerification: InvokeEmailVerification,
  ) => {
    const repoMap = new Map<string, BaseRepository<unknown>>([
      [usersRepository.constructor.name, usersRepository],
      [accountsRepository.constructor.name, accountsRepository],
    ]);

    const uow = new UowDrizzle(database, repoMap);

    return new SignUpByEmailUseCase(
      usersRepository,
      accountsRepository,
      hashService,
      eventPublisher,
      uow,
      invokeEmailVerification,
    );
  },
  inject: [
    IAM_DI_TOKENS.REPOSITORIES.USER,
    IAM_DI_TOKENS.REPOSITORIES.ACCOUNT,
    SHARED_DI_TOKENS.HASH_SERVICE,
    SHARED_DI_TOKENS.EVENT_PUBLISHER,
    SHARED_DI_TOKENS.DATABASE_CLIENT,
    IAM_DI_TOKENS.USE_CASES.INVOKE_EMAIL_VERIFICATION,
  ],
};

const signInByEmailUseCaseProvider: Provider = {
  provide: IAM_DI_TOKENS.USE_CASES.SIGN_IN_BY_EMAIL,
  useFactory: (accountsRepository: AccountsRepository, hashService: HashService, authService: AuthService, eventPublisher: EventPublisher) => {
    return new SignInByEmailUseCase(accountsRepository, hashService, authService, eventPublisher);
  },
  inject: [
    IAM_DI_TOKENS.REPOSITORIES.ACCOUNT,
    SHARED_DI_TOKENS.HASH_SERVICE,
    IAM_DI_TOKENS.SERVICES.AUTH,
    SHARED_DI_TOKENS.EVENT_PUBLISHER,
  ],
};

const invokeEmailVerificationUseCaseProvider: Provider = {
  provide: IAM_DI_TOKENS.USE_CASES.INVOKE_EMAIL_VERIFICATION,
  useFactory: (accountsRepository: AccountsRepository, redisService: RedisService, eventPublisher: EventPublisher) => {
    const attestService = new AttestServiceImpl(redisService.getClient(), { baseTable: 'iam:email_verification:attest', ttl: 24 * 60 * 60 * 1000 });

    return new InvokeEmailVerificationUseCase(accountsRepository, attestService, eventPublisher);
  },
  inject: [IAM_DI_TOKENS.REPOSITORIES.ACCOUNT, SHARED_DI_TOKENS.REDIS_SERVICE, SHARED_DI_TOKENS.EVENT_PUBLISHER],
};

const confirmEmailUseCaseProvider: Provider = {
  provide: IAM_DI_TOKENS.USE_CASES.CONFIRM_EMAIL_VERIFICATION,
  useFactory: (accountsRepository: AccountsRepository, redisService: RedisService, eventPublisher: EventPublisher) => {
    const attestService = new AttestServiceImpl(redisService.getClient(), { baseTable: 'iam:email_verification:attest', ttl: 24 * 60 * 60 * 1000 });

    return new ConfirmEmailUseCase(accountsRepository, attestService, eventPublisher);
  },
  inject: [IAM_DI_TOKENS.REPOSITORIES.ACCOUNT, SHARED_DI_TOKENS.REDIS_SERVICE, SHARED_DI_TOKENS.EVENT_PUBLISHER],
};

const refreshTokenUseCaseProvider: Provider = {
  provide: IAM_DI_TOKENS.USE_CASES.REFRESH_TOKEN,
  useFactory: (authService: AuthService, tokenRepository: TokenRepository) => {
    return new RefreshTokenUseCase(authService, tokenRepository);
  },
  inject: [IAM_DI_TOKENS.SERVICES.AUTH, IAM_DI_TOKENS.REPOSITORIES.TOKEN],
};

const findUserByIdUseCaseProvider: Provider = {
  provide: IAM_DI_TOKENS.USE_CASES.FIND_USER_BY_ID,
  useFactory: (usersRepository: UsersRepository) => {
    return new FindUserByIdUseCase(usersRepository);
  },
  inject: [IAM_DI_TOKENS.REPOSITORIES.USER],
};

const signOutUseCaseProvider: Provider = {
  provide: IAM_DI_TOKENS.USE_CASES.SIGN_OUT,
  useFactory: (tokenRepository: TokenRepository, userRepository: UsersRepository, eventPublisher: EventPublisher) => {
    return new SignOutUseCase(tokenRepository, userRepository, eventPublisher);
  },
  inject: [IAM_DI_TOKENS.REPOSITORIES.TOKEN, IAM_DI_TOKENS.REPOSITORIES.USER, SHARED_DI_TOKENS.EVENT_PUBLISHER],
};

const forgotPasswordUseCaseProvider: Provider = {
  provide: IAM_DI_TOKENS.USE_CASES.FORGOT_PASSWORD,
  useFactory: (accountsRepository: AccountsRepository, redisService: RedisService, eventPublisher: EventPublisher) => {
    const attestService = new AttestServiceImpl(redisService.getClient(), { baseTable: 'iam:password_reset:attest', ttl: 24 * 60 * 60 * 1000 });
    return new ForgotPasswordUseCase(accountsRepository, attestService, eventPublisher);
  },
  inject: [IAM_DI_TOKENS.REPOSITORIES.ACCOUNT, SHARED_DI_TOKENS.REDIS_SERVICE, SHARED_DI_TOKENS.EVENT_PUBLISHER],
};

const resetPasswordUseCaseProvider: Provider = {
  provide: IAM_DI_TOKENS.USE_CASES.RESET_PASSWORD,
  useFactory: (accountsRepository: AccountsRepository, redisService: RedisService, hashService: HashService, eventPublisher: EventPublisher) => {
    const attestService = new AttestServiceImpl(redisService.getClient(), { baseTable: 'iam:password_reset:attest', ttl: 24 * 60 * 60 * 1000 });
    return new ResetPasswordUseCase(accountsRepository, attestService, hashService, eventPublisher);
  },
  inject: [IAM_DI_TOKENS.REPOSITORIES.ACCOUNT, SHARED_DI_TOKENS.REDIS_SERVICE, SHARED_DI_TOKENS.HASH_SERVICE, SHARED_DI_TOKENS.EVENT_PUBLISHER],
};

export const useCasesProviders: Provider[] = [
  signUpByEmailUseCaseProvider,
  signInByEmailUseCaseProvider,
  invokeEmailVerificationUseCaseProvider,
  confirmEmailUseCaseProvider,
  refreshTokenUseCaseProvider,
  signOutUseCaseProvider,
  forgotPasswordUseCaseProvider,
  resetPasswordUseCaseProvider,
  findUserByIdUseCaseProvider,
];

export const strategyProviders: Provider[] = [JwtAccessStrategy, JwtRefreshStrategy];
