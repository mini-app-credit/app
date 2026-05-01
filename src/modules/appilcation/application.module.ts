import { DynamicModule, Module } from '@nestjs/common';
import { ApplicationsController } from './presentation/applications.controller';
import { RecipientController } from './presentation/recipient.controller';
import {
  applicationInfrastructureProviders,
  applicationUseCaseProviders,
} from './presentation/application.provider';

@Module({})
export class ApplicationModule {
  static forApi(): DynamicModule {
    return {
      module: ApplicationModule,
      controllers: [ApplicationsController, RecipientController],
      providers: [
        ...applicationInfrastructureProviders,
        ...applicationUseCaseProviders,
      ],
    };
  }
}
