import { DomainError } from './domain-error.base';

export class InvalidStateTransitionError extends DomainError {
  readonly code = 400;
  readonly statusCode = 400;

  constructor(
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`Invalid state transition from '${from}' to '${to}'`);
    this.name = 'InvalidStateTransitionError';
  }
}
