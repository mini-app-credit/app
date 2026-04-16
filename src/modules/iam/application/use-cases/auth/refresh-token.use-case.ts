import { RefreshTokenInput, RefreshTokenOutput } from '../../dtos/auth/refresh-token.dto';
import { Result, UseCase, UUIDIdentifier } from 'src/shared';
import { InvalidCredentialsError } from 'src/modules/iam/domain';
import { AuthService } from '../../services';
import { TokenRepository } from 'src/modules/iam/domain/repositories/token.repository';

export type RefreshToken = UseCase<RefreshTokenInput, Result<RefreshTokenOutput>>;

export class RefreshTokenUseCase implements RefreshToken {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenRepository: TokenRepository,
  ) { }

  async execute(input: RefreshTokenInput): Promise<Result<RefreshTokenOutput>> {
    try {
      const accountId = UUIDIdentifier.create(input.accountId);

      // 1. Verify token exists in repository (not revoked)
      const storedToken = await this.tokenRepository.findByAccountIdAndId(
        accountId,
        input.jti
      );

      if (!storedToken) {
        return [new InvalidCredentialsError(), null];
      }

      // 2. Delete old refresh token (rotation)
      await this.tokenRepository.deleteByAccountIdAndId(accountId, input.jti);

      // 3. Issue new token pair using AuthService
      const { accessToken, refreshToken } = await this.authService.issueTokenPair({
        userId: input.userId,
        accountId: input.accountId,
        email: input.email,
        provider: input.provider,
      });

      // 4. Return both tokens
      return [null, { access: { token: accessToken.value, expiresAt: accessToken.expiresAt }, refresh: { token: refreshToken.value, expiresAt: refreshToken.expiresAt } }];
    } catch (error) {
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
