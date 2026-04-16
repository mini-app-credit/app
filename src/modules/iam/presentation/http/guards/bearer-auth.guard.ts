import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload } from '../../../application/services';
import { IAM_DI_TOKENS } from '../../../infrastructure';
import type { AuthPayload } from '../decorators';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(
    @Inject(IAM_DI_TOKENS.SERVICES.JWT)
    private readonly jwtService: { validate(token: string): Promise<JwtPayload | null> },
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (typeof authHeader !== 'string' || !authHeader) {
      throw new UnauthorizedException('Unauthorized');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    const payload = await this.jwtService.validate(token);
    if (!payload || typeof payload.userId !== 'string' || !payload.userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    request.user = payload as unknown as AuthPayload;
    return true;
  }
}
