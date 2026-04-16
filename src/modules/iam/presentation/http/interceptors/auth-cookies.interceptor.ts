import { NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { map } from 'rxjs';
import { Response } from 'express';
import { AppConfig, DI_TOKENS } from 'src/shared';
import { signInByEmailResponseSchema } from '../dtos/auth.dto';

type AuthResponse = {
  access: {
    token: string;
    expiresAt: Date;
  };
  refresh?: {
    token: string;
    expiresAt: Date;
  };
};

export class AuthCookiesInterceptor implements NestInterceptor {
  constructor(
    @Inject(DI_TOKENS.CONFIG) private readonly appConfig: AppConfig,
  ) { }

  private isAuthResponse(data: unknown): data is AuthResponse {
    const result = signInByEmailResponseSchema.safeParse(data);
    return result.success;
  }

  private ACCESS_TOKEN_COOKIE_NAME = 'access_token';
  private REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

  intercept(context: ExecutionContext, next: CallHandler) {
    const isHttp = context.getType() === 'http';

    if (!isHttp) {
      return next.handle();
    }

    const response: Response = context.switchToHttp().getResponse();
    const isProduction = this.appConfig.NODE_ENV === 'production';

    return next.handle().pipe(
      map((data: unknown) => {
        if (this.isAuthResponse(data)) {
          response.cookie(this.ACCESS_TOKEN_COOKIE_NAME, data.access.token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            expires: data.access.expiresAt,
            path: '/',
          });

          if (data.refresh) {
            response.cookie(this.REFRESH_TOKEN_COOKIE_NAME, data.refresh.token, {
              httpOnly: true,
              secure: isProduction,
              sameSite: 'strict',
              expires: data.refresh.expiresAt,
              path: '/',
            });
          }
        }

        return data;
      }),
    );
  }
}

