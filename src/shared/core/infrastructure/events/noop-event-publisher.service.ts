import { Injectable } from '@nestjs/common';
import { EventPublisher } from '../../application/services';
import { DomainEvent } from '../../domain';

@Injectable()
export class NoopEventPublisher implements EventPublisher {
  async publish<T extends DomainEvent>(event: T): Promise<string> {
    return event.eventId;
  }

  publishMany<T extends DomainEvent>(events: T[]): Promise<string[]> {
    return Promise.all(events.map((e) => this.publish(e)));
  }
}
