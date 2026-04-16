import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { CLS_REQUEST_CONTEXT, RequestContext } from './request-context';

/**
 * Guard that populates CLS RequestContext after passport auth runs.
 * Registered globally via ClsModule guard setup — runs on every request.
 */
@Injectable()
export class RequestContextGuard implements CanActivate {
  constructor(private readonly cls: ClsService) { }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req) return true;

    const user = req.user as { userId?: string } | undefined;
    const rawHeaders = (req.headers ?? {}) as Record<string, string | string[] | undefined>;

    // Flatten headers to single string values
    const headers: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(rawHeaders)) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }

    const ctx: RequestContext = {
      userId: user?.userId ?? null,
      meta: { headers },
    };

    this.cls.set(CLS_REQUEST_CONTEXT, ctx);
    return true;
  }
}
