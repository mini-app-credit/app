import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { AuthCookiesInterceptor } from '../interceptors/auth-cookies.interceptor';

export const AuthCookies = () =>
  applyDecorators(
    UseInterceptors(AuthCookiesInterceptor),
  );

