import { Body, Controller, HttpCode, Inject, Post, HttpStatus } from "@nestjs/common";
import { ConfirmEmail, ForgotPassword, InvokeEmailVerification, RefreshToken, ResetPassword, SignInByEmail, SignOut, SignUpByEmail } from "src/modules/iam/application/use-cases";
import { IAM_DI_TOKENS } from "src/modules/iam/infrastructure";
import { Docs } from "../docs";
import { SignUpByEmailDto, SignInByEmailDto, ConfirmEmailDto, InvokeEmailVerificationDto, ForgotPasswordDto, ResetPasswordDto } from "../dtos";
import { Auth, AuthPayload, AuthCookies, RequireAuth } from "../decorators";
import { RateLimit, RATE_LIMIT_CATEGORY } from "src/shared";

@Controller('auth')
@Docs.auth.tags()
export class AuthController {
  constructor(
    @Inject(IAM_DI_TOKENS.USE_CASES.SIGN_UP_BY_EMAIL) private readonly signUpByEmailUseCase: SignUpByEmail,
    @Inject(IAM_DI_TOKENS.USE_CASES.SIGN_IN_BY_EMAIL) private readonly signInByEmailUseCase: SignInByEmail,
    @Inject(IAM_DI_TOKENS.USE_CASES.CONFIRM_EMAIL_VERIFICATION) private readonly confirmEmailUseCase: ConfirmEmail,
    @Inject(IAM_DI_TOKENS.USE_CASES.REFRESH_TOKEN) private readonly refreshTokenUseCase: RefreshToken,
    @Inject(IAM_DI_TOKENS.USE_CASES.INVOKE_EMAIL_VERIFICATION) private readonly invokeEmailVerificationUseCase: InvokeEmailVerification,
    @Inject(IAM_DI_TOKENS.USE_CASES.SIGN_OUT) private readonly signOutUseCase: SignOut,
    @Inject(IAM_DI_TOKENS.USE_CASES.FORGOT_PASSWORD) private readonly forgotPasswordUseCase: ForgotPassword,
    @Inject(IAM_DI_TOKENS.USE_CASES.RESET_PASSWORD) private readonly resetPasswordUseCase: ResetPassword,
  ) { }

  @Post('email/sign-up')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ category: RATE_LIMIT_CATEGORY.AUTH_SENSITIVE, execute: (request) => request.body.email })
  @Docs.auth.signUpByEmail()
  async signUpByEmail(@Body() body: SignUpByEmailDto) {
    const [error, result] = await this.signUpByEmailUseCase.execute(body);
    if (error) {
      throw error;
    }

    return result;
  }

  @Post('email/sign-in')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ category: RATE_LIMIT_CATEGORY.AUTH_SENSITIVE, execute: (request) => request.body.email })
  @AuthCookies()
  @Docs.auth.signInByEmail()
  async signInByEmail(@Body() body: SignInByEmailDto) {
    const [error, result] = await this.signInByEmailUseCase.execute(body);

    if (error) {
      throw error;
    }

    return result;
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ category: RATE_LIMIT_CATEGORY.AUTH_SENSITIVE, execute: (request) => request.body.email })
  @Docs.auth.confirmEmail()
  async confirmEmail(@Body() body: ConfirmEmailDto) {
    const [error, result] = await this.confirmEmailUseCase.execute(body);
    if (error) {
      throw error;
    }

    return result;
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ category: RATE_LIMIT_CATEGORY.AUTHENTICATED })
  @RequireAuth('jwt-refresh')
  @AuthCookies()
  @Docs.auth.refreshToken()
  async refreshToken(@Auth() auth: AuthPayload) {
    const [error, result] = await this.refreshTokenUseCase.execute({
      userId: auth.userId,
      accountId: auth.accountId,
      jti: auth.jti,
      email: auth.email,
      provider: auth.provider,
    });

    if (error) {
      throw error;
    }

    return result;
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ category: RATE_LIMIT_CATEGORY.AUTH_SENSITIVE, execute: (request) => request.body.email })
  @Docs.auth.invokeEmailVerification()
  async invokeEmailVerification(@Body() body: InvokeEmailVerificationDto) {
    const [error, result] = await this.invokeEmailVerificationUseCase.execute(body);

    if (error) {
      throw error;
    }

    return result;
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({ category: RATE_LIMIT_CATEGORY.AUTHENTICATED })
  @RequireAuth()
  @Docs.auth.signOut()
  async signOut(@Auth() auth: AuthPayload) {
    const [error] = await this.signOutUseCase.execute({
      userId: auth.userId,
      accountId: auth.accountId,
    });

    if (error) {
      throw error;
    }
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ category: RATE_LIMIT_CATEGORY.AUTH_SENSITIVE, execute: (request) => request.body.email })
  @Docs.auth.forgotPassword()
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const [error, result] = await this.forgotPasswordUseCase.execute(body);

    if (error) {
      throw error;
    }

    return result;
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ category: RATE_LIMIT_CATEGORY.AUTH_SENSITIVE, execute: (request) => request.body.email })
  @Docs.auth.resetPassword()
  async resetPassword(@Body() body: ResetPasswordDto) {
    const [error, result] = await this.resetPasswordUseCase.execute(body);

    if (error) {
      throw error;
    }

    return result;
  }
}