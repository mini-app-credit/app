import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventPublisher } from 'src/shared/core/application/services/event-publisher.service';
import { DomainEvent } from 'src/shared/core/domain';
import { ProcessEventNotificationUseCase } from '../../application/use-cases';
import { ProcessEventNotificationInput } from '../../application/dtos/email-template.dto';
import { TemplateRenderFailedError, TemplateNotFoundError } from '../../domain/errors';
import { NOTIFICATIONS_DI_TOKENS } from '../constants';

@Injectable()
export class InlineNotificationEventPublisher implements EventPublisher {
  private readonly logger = new Logger(InlineNotificationEventPublisher.name);

  constructor(
    @Inject(NOTIFICATIONS_DI_TOKENS.USE_CASES.PROCESS_EVENT_NOTIFICATION)
    private readonly processEventNotification: ProcessEventNotificationUseCase,
  ) {}

  async publish<T extends DomainEvent>(event: T): Promise<string> {
    const obj = event.toObject();
    const input: ProcessEventNotificationInput = {
      eventName: obj.eventName,
      eventId: obj.eventId,
      userId: obj.userId,
      payload: this.serializePayload(obj.payload),
    };

    try {
      const [error, result] = await this.processEventNotification.execute(input);

      if (error) {
        if (error instanceof TemplateRenderFailedError || error instanceof TemplateNotFoundError) {
          this.logger.debug({ err: error.message, eventName: obj.eventName }, 'Notification skipped (template)');
        } else {
          this.logger.warn({ err: error.message, eventName: obj.eventName }, 'Notification pipeline error');
        }
        return event.eventId;
      }

      if (result?.skipped) {
        this.logger.debug({ eventName: obj.eventName }, 'Notification skipped');
      }
    } catch (err) {
      this.logger.error({ err, eventName: obj.eventName }, 'Notification pipeline failed');
    }

    return event.eventId;
  }

  publishMany<T extends DomainEvent>(events: T[]): Promise<string[]> {
    return Promise.all(events.map((e) => this.publish(e)));
  }

  private serializePayload(payload: unknown): Record<string, unknown> {
    return JSON.parse(JSON.stringify(payload ?? {})) as Record<string, unknown>;
  }
}
