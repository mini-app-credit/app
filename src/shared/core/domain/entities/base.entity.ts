import { DomainEvent } from '../events/domain-event.base';
import { UUID } from '../../../types/common.types';
import { NanoIDIdentifier, NumberIdentifier, UUIDIdentifier } from '../value-objects';

/**
 * Base entity interface
 */
export interface EntityProps {
  id: UUID | number | NanoIDIdentifier | NumberIdentifier | UUIDIdentifier | string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base entity class following DDD patterns
 */
export abstract class BaseEntity<T extends EntityProps> {
  protected readonly _props: T;
  private _domainEvents: DomainEvent[] = [];

  constructor(props: T) {
    this._props = { ...props };
    this.validate();
  }

  /**
   * Get entity ID
   */
  get id(): T['id'] {
    return this._props.id;
  }

  /**
   * Get creation timestamp
   */
  get createdAt(): Date {
    return this._props.createdAt;
  }

  /**
   * Get last update timestamp
   */
  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  /**
   * Get all properties (read-only)
   */
  get props(): Readonly<T> {
    return Object.freeze({ ...this._props });
  }

  /**
   * Validate the entity
   */
  protected abstract validate(): void;

  /**
   * Add domain event
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Get domain events
   */
  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Clear domain events
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Mark entity as updated
   */
  protected markAsUpdated(): void {
    this._props.updatedAt = new Date();
  }

  /**
   * Check equality with another entity
   */
  public equals(entity: BaseEntity<any>): boolean {
    if (!(entity instanceof BaseEntity)) {
      return false;
    }

    return this.id === entity.id;
  }

  /**
   * Convert entity to plain object
   */
  public toObject(): T {
    return { ...this._props };
  }
}

export class AggregateRoot<T extends EntityProps> extends BaseEntity<T> {
  constructor(props: T) {
    super(props);
    this.validate();
  }

  protected validate(): void {
    throw new Error('Aggregate root must implement validate method.');
  }
}