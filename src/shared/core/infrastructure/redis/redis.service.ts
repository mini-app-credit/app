import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { SHARED_DI_TOKENS } from '../constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(SHARED_DI_TOKENS.REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    await Promise.race([
      new Promise((r) => setTimeout(r, 1000)),
      this.redis.quit(),
    ]);
  }

  getClient() {
    return this.redis;
  }
}
