import { UUID } from '../../../types/common.types';
import { uuid } from '../../../utils/id';

/**
 * Event names are defined per-module (not centralized).
 * Each module has its own event names const:
 *   - IAM: src/modules/iam/domain/events/iam-event-names.ts
 *   - Storage: src/modules/storage/domain/events/storage-event-names.ts
 *   - Content: src/modules/content/domain/events/content-event-names.ts
 *   - Dispatcher: src/modules/dispatcher/domain/events/dispatcher-event-names.ts
 */
export type EventKind = string;

export abstract class DomainEvent<T = any> {
  public readonly eventId: UUID;
  public readonly eventName: string;
  public readonly aggregateId: string;
  public readonly payload: T;
  public readonly occurredAt: Date;
  public readonly version: number;
  public readonly userId: UUID | null;


  constructor(
    eventName: EventKind,
    aggregateId: string,
    payload: T,
    version: number = 1,
    userId: UUID | null = null
  ) {
    this.eventId = uuid();
    this.eventName = eventName;
    this.aggregateId = aggregateId;
    this.payload = payload;
    this.occurredAt = new Date();
    this.version = version;
    this.userId = userId;
  }

  public toObject(): {
    eventId: UUID;
    eventName: string;
    aggregateId: string;
    payload: T;
    occurredAt: string;
    version: number;
    userId: UUID | null;
  } {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      payload: this.payload,
      occurredAt: this.occurredAt.toISOString(),
      version: this.version,
      userId: this.userId,
    };
  }
}
