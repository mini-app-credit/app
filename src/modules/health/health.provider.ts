import { Provider } from '@nestjs/common';
import { HEALTH_DI } from './health.constants';
import { DbIndicatorImpl, RedisIndicatorImpl, NatsIndicatorImpl, S3IndicatorImpl } from './indicators';

export const DbHealthServiceProvider: Provider = {
  provide: HEALTH_DI.DB_INDICATOR,
  useClass: DbIndicatorImpl,
};

export const RedisHealthServiceProvider: Provider = {
  provide: HEALTH_DI.REDIS_INDICATOR,
  useClass: RedisIndicatorImpl,
};

export const NatsHealthServiceProvider: Provider = {
  provide: HEALTH_DI.NATS_INDICATOR,
  useClass: NatsIndicatorImpl,
};

export const S3HealthServiceProvider: Provider = {
  provide: HEALTH_DI.S3_INDICATOR,
  useClass: S3IndicatorImpl,
};
