import { DomainEvent } from "../../domain";

/**
 * Event publisher interface for publishing domain events
 */
export interface EventPublisher {
  /**
   * Publish a single domain event
   */
  publish<T extends DomainEvent>(event: T): Promise<string>;

  /**
   * Publish multiple domain events
   */
  publishMany<T extends DomainEvent>(events: T[]): Promise<string[]>;
}
