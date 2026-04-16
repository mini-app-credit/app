import { createParamDecorator, ExecutionContext, UseGuards, applyDecorators, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PassportJwtPayload } from '../../../infrastructure';
import { ApiBearerAuth } from '@nestjs/swagger';
import { BearerAuthGuard } from '../guards/bearer-auth.guard';

export interface AuthPayload extends PassportJwtPayload {
  userId: string;
  accountId: string;
}

export const Auth = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthPayload => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as PassportJwtPayload;

    if (!user || !user.userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  },
);

export const RequireAuth = (
  strategy: 'jwt-access' | 'jwt-refresh' | 'bearer' = 'jwt-access',
) => {
  if (strategy === 'bearer') {
    return applyDecorators(ApiBearerAuth(), UseGuards(BearerAuthGuard));
  }

  return applyDecorators(
    ApiBearerAuth(strategy),
    UseGuards(AuthGuard(strategy)),
  );
};
