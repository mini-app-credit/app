import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { RetryOptions, SHARED_DI_TOKENS, withRetry, withTimeout } from 'src/shared';
import { S3Config } from 'src/shared/core/infrastructure/s3';

interface Options {
  timeout?: number;
  retry?: RetryOptions;
}

export interface S3Indicator {
  pingCheck(key: string, options?: Options): Promise<HealthIndicatorResult>;
}

@Injectable()
export class S3IndicatorImpl implements S3Indicator {
  constructor(
    @Inject(SHARED_DI_TOKENS.S3_CLIENT) private readonly s3Client: S3Client,
    @Inject(SHARED_DI_TOKENS.S3_CONFIG) private readonly s3Config: S3Config,
  ) {}

  async pingCheck(
    key: string,
    options?: Options,
  ): Promise<HealthIndicatorResult> {
    const timeoutMs = options?.timeout || 5000;
    const retryOptions: Required<RetryOptions> = {
      attempts: options?.retry?.attempts || 3,
      factor: options?.retry?.factor || 2,
      minTimeout: options?.retry?.minTimeout || 1000,
      maxTimeout: options?.retry?.maxTimeout || 10000,
    };

    try {
      await withRetry(
        () => withTimeout(() => this.ping(), timeoutMs),
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
    return this.s3Client.send(
      new HeadBucketCommand({ Bucket: this.s3Config.S3_BUCKET_NAME }),
    );
  }
}
