import { Provider } from '@nestjs/common';
import { PrometheusServiceImpl } from './metrics.service';
import { METRICS_DI } from './metrics.constants';
import { load } from './metrics.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpRequestMetricsInterceptor } from './http-request.interceptor';
import { MetricsService } from './metrics.service';

export const MetricsServiceProvider: Provider = {
  provide: METRICS_DI.SERVICE,
  useClass: PrometheusServiceImpl,
};

export const MetricsConfigProvider: Provider = {
  provide: METRICS_DI.CONFIG,
  useValue: load.from.env(process.env),
};

export const HttpMetricsInterceptorProvider: Provider = {
  provide: APP_INTERCEPTOR,
  useFactory: (metricsService: MetricsService) => {
    return new HttpRequestMetricsInterceptor(metricsService);
  },
  inject: [METRICS_DI.SERVICE],
};
