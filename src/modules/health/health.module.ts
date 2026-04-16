import { DynamicModule, Module } from '@nestjs/common';
import {
  DbHealthServiceProvider,
  RedisHealthServiceProvider,
  NatsHealthServiceProvider,
  S3HealthServiceProvider,
} from './health.provider';
import { HttpHealthController } from './http.controller';
import { TerminusModule } from '@nestjs/terminus';

@Module({})
export class HealthModule {
  static forApi(): DynamicModule {
    return {
      module: HealthModule,
      imports: [TerminusModule],
      providers: [DbHealthServiceProvider, RedisHealthServiceProvider, NatsHealthServiceProvider, S3HealthServiceProvider],
      controllers: [HttpHealthController],
    };
  }
}
