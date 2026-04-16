import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { SHARED_DI_TOKENS } from 'src/shared';
import { IamModule } from '../../iam/presentation';
import { InlineNotificationEventPublisher, NOTIFICATIONS_DI_TOKENS, notificationsProviders } from '../infrastructure';
import { EmailTemplatesController } from './http/controllers';

const inlineEventPublisherProvider: Provider = {
  provide: SHARED_DI_TOKENS.EVENT_PUBLISHER,
  useClass: InlineNotificationEventPublisher,
};

const providersWithPublisher = [...notificationsProviders, inlineEventPublisherProvider];

const exportsList = [
  NOTIFICATIONS_DI_TOKENS.REPOSITORIES.EMAIL_TEMPLATES,
  NOTIFICATIONS_DI_TOKENS.SERVICES.TEMPLATE_RENDERER,
  NOTIFICATIONS_DI_TOKENS.SERVICES.EMAIL_SENDER,
  SHARED_DI_TOKENS.EVENT_PUBLISHER,
];

const httpControllers = [EmailTemplatesController];

@Global()
@Module({})
export class NotificationsModule {
  static forApi(): DynamicModule {
    return {
      module: NotificationsModule,
      imports: [IamModule.forProviders()],
      controllers: httpControllers,
      providers: providersWithPublisher,
      exports: exportsList,
    };
  }

  static forWorker(): DynamicModule {
    return {
      module: NotificationsModule,
      imports: [IamModule.forProviders()],
      controllers: [],
      providers: providersWithPublisher,
      exports: exportsList,
    };
  }
}
