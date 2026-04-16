import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';

interface Options {
  timeout?: number;
  retry?: {
    attempts?: number;
    factor?: number;
    minTimeout?: number;
    maxTimeout?: number;
  };
}

export interface NatsIndicator {
  pingCheck(key: string, options?: Options): Promise<HealthIndicatorResult>;
}

@Injectable()
export class NatsIndicatorImpl implements NatsIndicator {
  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    return {
      [key]: {
        status: 'up',
        info: 'nats disabled',
      },
    };
  }
}
