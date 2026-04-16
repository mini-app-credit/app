import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../../application';
import { RateCategory, RATE_LIMIT_CATEGORY } from '../../domain';
import { Request, Response } from 'express';
import { RateLimitConfig } from '../../infrastructure';

export interface PublicRateLimitOptions {
  category: 'public'
  execute?: null;
}

export interface AuthSensitiveRateLimitOptions<R extends Request> {
  category: 'auth-sensitive';
  execute: (request: R) => string;
}

export interface AuthenticatedRateLimitOptions {
  category: 'authenticated';
  execute?: null;
}

export type RateLimitOptions<R extends Request> = PublicRateLimitOptions | AuthSensitiveRateLimitOptions<R> | AuthenticatedRateLimitOptions;


const RATE_LIMIT_METADATA = 'rate-limit:options';

export const RateLimit = <R extends Request>(options: RateLimitOptions<R>) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(RATE_LIMIT_METADATA, options, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
    private readonly rateLimitConfigs: Record<RateCategory, RateLimitConfig>
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();

    // Get rate limit options from decorator metadata
    const options = this.reflector.get<RateLimitOptions<Request>>(RATE_LIMIT_METADATA, handler);

    // If no decorator, skip rate limiting
    if (!options) {
      return true;
    }

    const category = options.category;
    const key = this.getKeyForCategory(category, request, options);
    const limit = this.getLimitForCategory(category);
    const response = context.switchToHttp().getResponse<Response>();

    if (!key) {
      this.logger.warn({ rateLimitCategory: category }, 'Could not determine rate limit key');
      // Set headers with default values but fail open
      const defaultResetTime = this.rateLimitConfigs[category].windowMs;
      const defaultRetryAfter = Math.ceil(defaultResetTime / 1000);
      const defaultReset = Date.now() + defaultResetTime;
      
      response.set('Retry-After', defaultRetryAfter.toString());
      response.set('X-RateLimit-Limit', limit.toString());
      response.set('X-RateLimit-Remaining', limit.toString());
      response.set('X-RateLimit-Reset', defaultReset.toString());
      
      return true; // Fail open
    }

    const isAllowed = await this.rateLimitService.isAllowed(key, category);
    // getRemainingRequests is called AFTER isAllowed, which already added the request
    const remaining = await this.rateLimitService.getRemainingRequests(key, category, true);
    const resetTime = await this.rateLimitService.getResetTime(key, category);
    const retryAfter = Math.ceil(resetTime / 1000);
    const reset = Date.now() + (resetTime > 0 ? resetTime : this.rateLimitConfigs[category].windowMs);

    response.set('Retry-After', retryAfter.toString());
    response.set('X-RateLimit-Limit', limit.toString());
    response.set('X-RateLimit-Remaining', remaining.toString());
    response.set('X-RateLimit-Reset', reset.toString());

    if (!isAllowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    request.rateLimitInfo = {
      limit,
      remaining,
      reset,
    };

    return true;
  }

  private getKeyForCategory<R extends Request>(category: RateCategory, request: R, options: RateLimitOptions<R>): string | null {
    const ipAddress = this.getClientIp(request);

    switch (category) {
      case RATE_LIMIT_CATEGORY.PUBLIC:
        // Rate limit by IP
        return `public:${ipAddress}`;

      case RATE_LIMIT_CATEGORY.AUTH_SENSITIVE:
        {
          const pattern = options.execute?.(request);
          if (!pattern) {
            return null;
          }
          return `auth-sensitive:${ipAddress}:${pattern}`;
        }

      case RATE_LIMIT_CATEGORY.AUTHENTICATED:
        // Rate limit by user_id (from JWT token)
        // Note: For authenticated endpoints, request.user may not be set yet if this guard
        // executes before AuthGuard (global guards run before route guards).
        // We handle this by setting default headers and failing open.
        {
          const auth = request.user;
          if (!auth?.userId) {
            // User not authenticated yet - this is expected when RateLimitGuard runs
            // as a global guard before AuthGuard. Headers will be set with defaults.
            this.logger.debug('Authenticated rate limit but no user in request yet (guard execution order)');
            return null;
          }
          return `authenticated:${auth.userId}`;
        }

      default:
        return null;
    }
  }

  private getClientIp(request: any): string {
    // Check for IP in order: X-Forwarded-For, X-Real-IP, connection.remoteAddress
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    return request.connection?.remoteAddress || 'unknown';
  }

  private getLimitForCategory(category: RateCategory): number {
    return this.rateLimitConfigs[category].maxRequests;
  }
}
