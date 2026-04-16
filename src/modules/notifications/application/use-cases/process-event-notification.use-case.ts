import { Logger } from '@nestjs/common';
import { Result, UseCase } from 'src/shared';
import { EmailTemplatesRepository } from '../../domain/repositories';
import { EmailSenderService } from '../services/email-sender';
import { TemplateRendererService } from '../services/template-renderer';
import { ProcessEventNotificationInput } from '../dtos/email-template.dto';
import { UserResolverPort } from '../services/user-resolve-port';

export interface ProcessEventNotificationOutput {
  delivered: boolean;
  skipped: boolean;
  unparseable?: boolean;
}

export type ProcessEventNotification = UseCase<
  ProcessEventNotificationInput,
  Result<ProcessEventNotificationOutput>
>;

export class ProcessEventNotificationUseCase implements ProcessEventNotification {
  private readonly logger = new Logger(ProcessEventNotificationUseCase.name);

  constructor(
    private readonly emailTemplatesRepository: EmailTemplatesRepository,
    private readonly renderService: TemplateRendererService,
    private readonly emailService: EmailSenderService,
    private readonly userResolver: UserResolverPort,
  ) { }


  async execute(event: ProcessEventNotificationInput): Promise<Result<ProcessEventNotificationOutput>> {
    try {
      const template = await this.emailTemplatesRepository.findByEventName(event.eventName);
      if (!template) {
        return [null, { delivered: false, skipped: true }];
      }

      if (!event.userId) {
        this.logger.warn(
          { eventName: event.eventName, eventId: event.eventId },
          'Notification skipped: event has no userId',
        );
        return [null, { delivered: false, skipped: true }];
      }

      const recipientEmail = await this.userResolver.getEmail(event.userId);
      if (!recipientEmail) {
        this.logger.warn(
          { eventName: event.eventName, eventId: event.eventId, userId: event.userId },
          'Notification skipped: recipient email not found',
        );
        return [null, { delivered: false, skipped: true }];
      }


      const [renderError, rendered] = await this.renderService.render({
        templatePath: template.templatePath,
        props: event.payload,
      });
      if (renderError) throw renderError;

      await this.emailService.send({
        to: recipientEmail,
        html: rendered!.html,
        subject: rendered!.subject,
      });

      return [null, { delivered: true, skipped: false }];
    } catch (error) {
      this.logger.error({ err: error, event }, 'Failed to process event notification');
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
