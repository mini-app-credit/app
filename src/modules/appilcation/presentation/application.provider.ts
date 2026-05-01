import { Provider } from '@nestjs/common';
import { Database, SHARED_DI_TOKENS } from 'src/shared';
import {
  NOTIFICATIONS_DI_TOKENS,
  type NotificationsConfig,
} from 'src/modules/notifications';
import { EmailSenderService } from 'src/modules/notifications/application/services/email-sender';
import {
  APPLICATION_DI_TOKENS,
  DrizzleApplicationRepository,
  GeminiPdfParserAdapter,
  GeminiSummarizerAdapter,
  NestEmailSenderAdapter,
  NotificationsPublicUrlAdapter,
} from '../infrastructure';
import { ApplicationRepository } from '../domain';
import {
  AiSummarizerPort,
  EmailSenderPort,
  PdfParserPort,
  PublicUrlPort,
} from '../application/ports';
import {
  CreateApplicationUseCase,
  DecideApplicationUseCase,
  DeleteApplicationUseCase,
  GenerateAiSummaryUseCase,
  GetApplicationByTokenUseCase,
  GetApplicationUseCase,
  ListApplicationsUseCase,
  ParseApplicationPdfUseCase,
  SendApplicationUseCase,
  SubmitApplicationUseCase,
  UpdateApplicationUseCase,
} from '../application/use-cases';

const applicationRepositoryProvider: Provider = {
  provide: APPLICATION_DI_TOKENS.REPOSITORIES.APPLICATION,
  useFactory: (db: Database) => new DrizzleApplicationRepository(db),
  inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
};

const emailSenderProvider: Provider = {
  provide: APPLICATION_DI_TOKENS.PORTS.EMAIL_SENDER,
  useFactory: (svc: EmailSenderService) => new NestEmailSenderAdapter(svc),
  inject: [NOTIFICATIONS_DI_TOKENS.SERVICES.EMAIL_SENDER],
};

const aiSummarizerProvider: Provider = {
  provide: APPLICATION_DI_TOKENS.PORTS.AI_SUMMARIZER,
  useFactory: () => new GeminiSummarizerAdapter(),
};

const pdfParserProvider: Provider = {
  provide: APPLICATION_DI_TOKENS.PORTS.PDF_PARSER,
  useFactory: () => new GeminiPdfParserAdapter(),
};

const publicUrlProvider: Provider = {
  provide: APPLICATION_DI_TOKENS.PORTS.PUBLIC_URL,
  useFactory: (cfg: NotificationsConfig) => new NotificationsPublicUrlAdapter(cfg),
  inject: [NOTIFICATIONS_DI_TOKENS.CONFIGS.NOTIFICATIONS],
};

export const applicationInfrastructureProviders: Provider[] = [
  applicationRepositoryProvider,
  emailSenderProvider,
  aiSummarizerProvider,
  pdfParserProvider,
  publicUrlProvider,
];

export const applicationUseCaseProviders: Provider[] = [
  {
    provide: APPLICATION_DI_TOKENS.USE_CASES.CREATE,
    useFactory: (repo: ApplicationRepository) => new CreateApplicationUseCase(repo),
    inject: [APPLICATION_DI_TOKENS.REPOSITORIES.APPLICATION],
  },
  {
    provide: APPLICATION_DI_TOKENS.USE_CASES.UPDATE,
    useFactory: (repo: ApplicationRepository) => new UpdateApplicationUseCase(repo),
    inject: [APPLICATION_DI_TOKENS.REPOSITORIES.APPLICATION],
  },
  {
    provide: APPLICATION_DI_TOKENS.USE_CASES.SEND,
    useFactory: (
      repo: ApplicationRepository,
      email: EmailSenderPort,
      urls: PublicUrlPort,
    ) => new SendApplicationUseCase(repo, email, urls),
    inject: [
      APPLICATION_DI_TOKENS.REPOSITORIES.APPLICATION,
      APPLICATION_DI_TOKENS.PORTS.EMAIL_SENDER,
      APPLICATION_DI_TOKENS.PORTS.PUBLIC_URL,
    ],
  },
  {
    provide: APPLICATION_DI_TOKENS.USE_CASES.SUBMIT,
    useFactory: (
      repo: ApplicationRepository,
      email: EmailSenderPort,
      urls: PublicUrlPort,
    ) => new SubmitApplicationUseCase(repo, email, urls),
    inject: [
      APPLICATION_DI_TOKENS.REPOSITORIES.APPLICATION,
      APPLICATION_DI_TOKENS.PORTS.EMAIL_SENDER,
      APPLICATION_DI_TOKENS.PORTS.PUBLIC_URL,
    ],
  },
  {
    provide: APPLICATION_DI_TOKENS.USE_CASES.DECIDE,
    useFactory: (repo: ApplicationRepository) => new DecideApplicationUseCase(repo),
    inject: [APPLICATION_DI_TOKENS.REPOSITORIES.APPLICATION],
  },
  {
    provide: APPLICATION_DI_TOKENS.USE_CASES.GET,
    useFactory: (repo: ApplicationRepository) => new GetApplicationUseCase(repo),
    inject: [APPLICATION_DI_TOKENS.REPOSITORIES.APPLICATION],
  },
  {
    provide: APPLICATION_DI_TOKENS.USE_CASES.GET_BY_TOKEN,
    useFactory: (repo: ApplicationRepository) => new GetApplicationByTokenUseCase(repo),
    inject: [APPLICATION_DI_TOKENS.REPOSITORIES.APPLICATION],
  },
  {
    provide: APPLICATION_DI_TOKENS.USE_CASES.LIST,
    useFactory: (repo: ApplicationRepository) => new ListApplicationsUseCase(repo),
    inject: [APPLICATION_DI_TOKENS.REPOSITORIES.APPLICATION],
  },
  {
    provide: APPLICATION_DI_TOKENS.USE_CASES.DELETE,
    useFactory: (repo: ApplicationRepository) => new DeleteApplicationUseCase(repo),
    inject: [APPLICATION_DI_TOKENS.REPOSITORIES.APPLICATION],
  },
  {
    provide: APPLICATION_DI_TOKENS.USE_CASES.AI_SUMMARY,
    useFactory: (repo: ApplicationRepository, ai: AiSummarizerPort) =>
      new GenerateAiSummaryUseCase(repo, ai),
    inject: [
      APPLICATION_DI_TOKENS.REPOSITORIES.APPLICATION,
      APPLICATION_DI_TOKENS.PORTS.AI_SUMMARIZER,
    ],
  },
  {
    provide: APPLICATION_DI_TOKENS.USE_CASES.PARSE_PDF,
    useFactory: (parser: PdfParserPort) => new ParseApplicationPdfUseCase(parser),
    inject: [APPLICATION_DI_TOKENS.PORTS.PDF_PARSER],
  },
];
