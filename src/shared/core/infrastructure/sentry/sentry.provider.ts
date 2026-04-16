import { Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

export const SentryFilterProvider: Provider = {
  provide: APP_FILTER,
  useClass: SentryGlobalFilter,
};
