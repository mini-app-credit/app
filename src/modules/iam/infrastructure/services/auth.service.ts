import { UUIDIdentifier } from "src/shared";
import { AuthService, AuthServiceContext, JwtService, TokenPair } from "../../application/services";
import { Token, TokenRepository, TokenType } from "../../domain";

/**
 * Concrete implementation of AuthService
 */
export class AuthServiceImpl implements AuthService {
  constructor(private readonly jwtService: JwtService, private readonly tokenRepository: TokenRepository) { }

  async issueTokenPair(context: AuthServiceContext): Promise<TokenPair> {
    const accessToken = await this.issueAccessToken(context);
    const refreshToken = await this.issueRefreshToken(context);

    return {
      accessToken,
      refreshToken,
    };
  }

  async issueAccessToken(context: AuthServiceContext): Promise<Token> {
    const jti = UUIDIdentifier.generate();
    const token = await this.jwtService.generate(
      {
        jti: jti.toString(),
        userId: context.userId,
        accountId: context.accountId,
        email: context.email,
        provider: context.provider,
      },
      { expiresIn: '15m' },
    );

    const now = new Date();

    const newTokenEntity = Token.create({
      id: jti,
      userId: UUIDIdentifier.create(context.userId),
      accountId: UUIDIdentifier.create(context.accountId),
      type: TokenType.access(),
      value: token,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes
    });

    return newTokenEntity;
  }

  async issueRefreshToken(context: AuthServiceContext): Promise<Token> {
    const jti = UUIDIdentifier.generate();

    const token = await this.jwtService.generate(
      {
        jti: jti.toString(),
        userId: context.userId,
        accountId: context.accountId,
        email: context.email,
        provider: context.provider,
      },
      { expiresIn: '7d' },
    );

    const now = new Date();
    const newTokenEntity = Token.create({
      id: jti,
      userId: UUIDIdentifier.create(context.userId),
      accountId: UUIDIdentifier.create(context.accountId),
      type: TokenType.refresh(),
      value: token,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await this.tokenRepository.save([newTokenEntity]);

    return newTokenEntity;
  }
}