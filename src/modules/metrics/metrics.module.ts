import { DynamicModule, Module } from '@nestjs/common';
import {
  HttpMetricsInterceptorProvider,
  MetricsConfigProvider,
  MetricsServiceProvider,
} from './metrics.provider';
import { MetricsHttpController } from './http.controller';

@Module({})
export class MetricsModule {
  static forRoot(): DynamicModule {
    return {
      module: MetricsModule,
      controllers: [MetricsHttpController],
      providers: [
        MetricsServiceProvider,
        MetricsConfigProvider,
        HttpMetricsInterceptorProvider,
      ],
      exports: [MetricsServiceProvider],
      global: true,
    };
  }
}
