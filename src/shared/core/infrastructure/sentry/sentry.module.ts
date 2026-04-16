import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryModule as SentryNestModule } from '@sentry/nestjs/setup';
import { SentryFilterProvider } from './sentry.provider';
import { DomainErrorFilter } from '../../presentation/filters';

@Global()
@Module({
  imports: [SentryNestModule.forRoot()],
  providers: [
    SentryFilterProvider,
    {
      provide: APP_FILTER,
      useClass: DomainErrorFilter,
    },
  ],
  exports: [],
})
export class SentryModule {}
