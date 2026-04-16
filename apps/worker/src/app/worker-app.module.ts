import { Module } from '@nestjs/common';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { LoggerModule } from 'nestjs-pino';
import { loggerOptions } from 'src/shared';
import {
  IamModule,
  NotificationsModule,
} from 'src/modules';
import { SharedModule } from 'src/shared';

@Module({
  imports: [
    SharedModule,
    LoggerModule.forRoot(loggerOptions()),
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
    NotificationsModule.forWorker(),
    IamModule.forWorker(),
  ],
})
export class WorkerAppModule {}
