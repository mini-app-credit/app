import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { tap } from 'rxjs';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

export class HttpRequestMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const isHttp = context.getType() === 'http';

    if (!isHttp) {
      return next.handle();
    }

    const request: Request = context.switchToHttp().getRequest();
    const method = request.method;
    const route = request.url;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response: Response = context.switchToHttp().getResponse();

          const statusCode = response.statusCode;
          const duration = (Date.now() - start) / 1000;

          this.metrics.incrementHttpRequest(method, route, statusCode);
          this.metrics.observeRequestDuration(
            method,
            route,
            statusCode,
            duration,
          );
        },
        error: (err: Error) => {
          const statusCode =
            (err as unknown as { status?: number })?.status || 500;
          const duration = (Date.now() - start) / 1000;

          this.metrics.incrementHttpRequest(method, route, statusCode);
          this.metrics.observeRequestDuration(
            method,
            route,
            statusCode,
            duration,
          );
        },
      }),
    );
  }
}
