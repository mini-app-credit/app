import { HealthIndicatorResult } from '@nestjs/terminus';
import { Inject, Injectable } from '@nestjs/common';
import { RedisService, RetryOptions, SHARED_DI_TOKENS, withRetry, withTimeout } from 'src/shared';

interface Options {
  timeout?: number;
  retry?: RetryOptions;
}

export interface RedisIndicator {
  pingCheck(key: string, options?: Options): Promise<HealthIndicatorResult>;
}

@Injectable()
export class RedisIndicatorImpl implements RedisIndicator {
  constructor(
    @Inject(SHARED_DI_TOKENS.REDIS_SERVICE) private readonly redisService: RedisService,
  ) {}

  async pingCheck(
    key: string,
    options?: Options,
  ): Promise<HealthIndicatorResult> {
    const timeout = options?.timeout || 5000; // Default 5s timeout
    const retryOptions: Required<RetryOptions> = {
      attempts: options?.retry?.attempts || 3,
      factor: options?.retry?.factor || 2,
      minTimeout: options?.retry?.minTimeout || 1000,
      maxTimeout: options?.retry?.maxTimeout || 10000,
    };

    try {
      await withRetry(
        () => withTimeout(() => this.ping(), timeout),
        retryOptions,
      );

      return {
        [key]: {
          status: 'up',
        },
      };
    } catch (error) {
      return {
        [key]: {
          status: 'down',
          error,
        },
      };
    }
  }

  private ping() {
    return this.redisService.getClient().ping();
  }
}
