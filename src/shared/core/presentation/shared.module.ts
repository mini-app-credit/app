import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { CorrelationMiddleware, SentryModule } from '../infrastructure';
import { RequestContextGuard } from '../infrastructure/cls';
import { exportedProviders, sharedProvider } from './shared.provider';


@Module({
  imports: [
    SentryModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
      },
      guard: {
        mount: true,
        setup: (cls, context) => {
          const guard = new RequestContextGuard(cls);
          guard.canActivate(context);
        },
      },
    }),
  ],
  providers: sharedProvider,
  exports: exportedProviders,
})
@Global()
export class SharedModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
