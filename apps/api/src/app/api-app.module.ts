import { Module } from '@nestjs/common';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { LoggerModule } from 'nestjs-pino';
import { loggerOptions } from 'src/shared';
import {
  HealthModule,
  IamModule,
  MetricsModule,
  NotificationsModule,
} from 'src/modules';
import { SharedModule } from 'src/shared';

const invalidEnvs = ['production', 'test'];

const isInvalid = invalidEnvs.includes(process.env.NODE_ENV!)
@Module({
  imports: [
    SharedModule,
    LoggerModule.forRoot(loggerOptions()),
    MetricsModule.forRoot(),
    ...(isInvalid ? [] : [DevtoolsModule.register({
      http: true,
    })]),
    HealthModule.forApi(),
    NotificationsModule.forApi(),
    IamModule.forApi(),
  ],
})
export class ApiAppModule { }
