import { Provider } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Database, SHARED_DI_TOKENS } from 'src/shared';
import Redis from 'ioredis';
import {
  CreateEmailTemplateUseCase,
  DeleteEmailTemplateUseCase,
  GetEmailTemplateUseCase,
  ListEmailTemplatesUseCase,
  ProcessEventNotificationUseCase,
} from '../../application/use-cases';
import {
  EmailSenderService,
  TemplateRendererService,
} from '../../application/services';
import { EmailTemplatesRepository } from '../../domain/repositories';
import { loadNotificationsConfig, NotificationsConfig } from '../configs';
import { NOTIFICATIONS_DI_TOKENS } from '../constants';
import { EmailTemplatesRepositoryImpl } from '../repositories';
import {
  EmailTemplateCacheService,
  ReactEmailRendererService,
  EmailService,
} from '../services';
import { UserResolverPort } from '../../application/services/user-resolve-port';
import { UserService } from 'src/modules/iam/application/services/user.service';
import { UserResolverAdapter } from '../services/user-resolve-adapter';
import { IAM_DI_TOKENS } from 'src/modules/iam/infrastructure';

const notificationsConfigProvider: Provider = {
  provide: NOTIFICATIONS_DI_TOKENS.CONFIGS.NOTIFICATIONS,
  useValue: loadNotificationsConfig.from.env(process.env),
};

const emailTemplateCacheServiceProvider: Provider = {
  provide: NOTIFICATIONS_DI_TOKENS.SERVICES.EMAIL_TEMPLATE_CACHE,
  useFactory: (redis: Redis) => new EmailTemplateCacheService(redis),
  inject: [SHARED_DI_TOKENS.REDIS_CLIENT],
};

const emailTemplatesRepositoryProvider: Provider = {
  provide: NOTIFICATIONS_DI_TOKENS.REPOSITORIES.EMAIL_TEMPLATES,
  useFactory: (database: Database, cache: EmailTemplateCacheService) =>
    new EmailTemplatesRepositoryImpl(database, cache),
  inject: [SHARED_DI_TOKENS.DATABASE_CLIENT, NOTIFICATIONS_DI_TOKENS.SERVICES.EMAIL_TEMPLATE_CACHE],
};

const templateRendererProvider: Provider = {
  provide: NOTIFICATIONS_DI_TOKENS.SERVICES.TEMPLATE_RENDERER,
  useFactory: (config: NotificationsConfig, logger: PinoLogger): TemplateRendererService =>
    new ReactEmailRendererService(config, logger),
  inject: [NOTIFICATIONS_DI_TOKENS.CONFIGS.NOTIFICATIONS, PinoLogger],
};

const emailSenderProvider: Provider = {
  provide: NOTIFICATIONS_DI_TOKENS.SERVICES.EMAIL_SENDER,
  useFactory: (config: NotificationsConfig): EmailService => new EmailService(config),
  inject: [NOTIFICATIONS_DI_TOKENS.CONFIGS.NOTIFICATIONS],
};

const userResolverProvider: Provider = {
  provide: NOTIFICATIONS_DI_TOKENS.SERVICES.USER_RESOLVER,
  useFactory: (userService: UserService) => new UserResolverAdapter(userService),
  inject: [IAM_DI_TOKENS.SERVICES.USER],
};

const getEmailTemplateUseCaseProvider: Provider = {
  provide: NOTIFICATIONS_DI_TOKENS.USE_CASES.GET_EMAIL_TEMPLATE,
  useFactory: (repository: EmailTemplatesRepository) => new GetEmailTemplateUseCase(repository),
  inject: [NOTIFICATIONS_DI_TOKENS.REPOSITORIES.EMAIL_TEMPLATES],
};

const createEmailTemplateUseCaseProvider: Provider = {
  provide: NOTIFICATIONS_DI_TOKENS.USE_CASES.CREATE_EMAIL_TEMPLATE,
  useFactory: (repository: EmailTemplatesRepository) =>
    new CreateEmailTemplateUseCase(repository),
  inject: [NOTIFICATIONS_DI_TOKENS.REPOSITORIES.EMAIL_TEMPLATES],
};

const deleteEmailTemplateUseCaseProvider: Provider = {
  provide: NOTIFICATIONS_DI_TOKENS.USE_CASES.DELETE_EMAIL_TEMPLATE,
  useFactory: (repository: EmailTemplatesRepository) =>
    new DeleteEmailTemplateUseCase(repository),
  inject: [NOTIFICATIONS_DI_TOKENS.REPOSITORIES.EMAIL_TEMPLATES],
};

const listEmailTemplatesUseCaseProvider: Provider = {
  provide: NOTIFICATIONS_DI_TOKENS.USE_CASES.LIST_EMAIL_TEMPLATES,
  useFactory: (repository: EmailTemplatesRepository) => new ListEmailTemplatesUseCase(repository),
  inject: [NOTIFICATIONS_DI_TOKENS.REPOSITORIES.EMAIL_TEMPLATES],
};

const processEventNotificationUseCaseProvider: Provider = {
  provide: NOTIFICATIONS_DI_TOKENS.USE_CASES.PROCESS_EVENT_NOTIFICATION,
  useFactory: (
    repository: EmailTemplatesRepository,
    templateRenderer: TemplateRendererService,
    emailSender: EmailSenderService,
    userResolver: UserResolverPort,
  ) => new ProcessEventNotificationUseCase(repository, templateRenderer, emailSender, userResolver),
  inject: [
    NOTIFICATIONS_DI_TOKENS.REPOSITORIES.EMAIL_TEMPLATES,
    NOTIFICATIONS_DI_TOKENS.SERVICES.TEMPLATE_RENDERER,
    NOTIFICATIONS_DI_TOKENS.SERVICES.EMAIL_SENDER,
    NOTIFICATIONS_DI_TOKENS.SERVICES.USER_RESOLVER,
  ],
};

export const notificationsProviders: Provider[] = [
  notificationsConfigProvider,
  emailTemplateCacheServiceProvider,
  emailTemplatesRepositoryProvider,
  templateRendererProvider,
  emailSenderProvider,
  userResolverProvider,
  createEmailTemplateUseCaseProvider,
  getEmailTemplateUseCaseProvider,
  deleteEmailTemplateUseCaseProvider,
  listEmailTemplatesUseCaseProvider,
  processEventNotificationUseCaseProvider,
];
