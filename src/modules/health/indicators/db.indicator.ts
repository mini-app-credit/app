import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import { Database, RetryOptions, SHARED_DI_TOKENS, withRetry, withTimeout } from 'src/shared';

interface Options {
  timeout?: number;
  retry?: RetryOptions;
}

export interface DbIndicator {
  pingCheck(key: string, options?: Options): Promise<HealthIndicatorResult>;
}

@Injectable()
export class DbIndicatorImpl implements DbIndicator {
  constructor(@Inject(SHARED_DI_TOKENS.DATABASE_CLIENT) private readonly db: Database) {}

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
    return this.db.execute(sql`SELECT 1`);
  }
}
