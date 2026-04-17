import { DynamicModule, Module } from '@nestjs/common';
import { ApplicationRepository } from './application.repository';
import { ApplicationService } from './application.service';
import { ApplicationsController } from './applications.controller';
import { RecipientController } from './recipient.controller';

@Module({})
export class ApplicationModule {
  static forApi(): DynamicModule {
    return {
      module: ApplicationModule,
      controllers: [ApplicationsController, RecipientController],
      providers: [ApplicationRepository, ApplicationService],
    };
  }
}
