import { ENTITY_STATES, EntityState } from '../constants/entity-state';

/**
 * Entity behavior — a set of props + getters + methods that can be mixed into an entity.
 *
 * Behaviors are plain objects that operate on entity props.
 * Entity creates behaviors in constructor and delegates to them.
 *
 * Usage in entity:
 * ```ts
 * export class Channel extends AggregateRoot<ChannelProps> {
 *   readonly softDelete = new SoftDeleteBehavior(this._props, () => this.markAsUpdated());
 * }
 * ```
 *
 * Access:
 * ```ts
 * channel.softDelete.isActive
 * channel.softDelete.delete()
 * ```
 */

// --- SoftDelete ---

export interface SoftDeleteProps {
  state: EntityState;
}

export class SoftDeleteBehavior<T extends SoftDeleteProps> {
  constructor(
    private readonly props: T,
    private readonly onUpdate: () => void,
  ) { }

  get state(): EntityState {
    return this.props.state;
  }

  get isActive(): boolean {
    return this.props.state === ENTITY_STATES.ACTIVE;
  }

  get isDeleted(): boolean {
    return this.props.state === ENTITY_STATES.DELETED;
  }

  delete(): void {
    this.props.state = ENTITY_STATES.DELETED;
    this.onUpdate();
  }
}

// --- Versioned ---

export interface VersionedProps {
  version: number;
}

export class VersionedBehavior<T extends VersionedProps> {
  constructor(
    private readonly props: T,
    private readonly onUpdate: () => void,
  ) { }

  get version(): number {
    return this.props.version;
  }

  increment(): void {
    this.props.version += 1;
    this.onUpdate();
  }
}
