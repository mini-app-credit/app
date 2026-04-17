import { NotFoundError, BadRequestError, ConflictError } from 'src/shared';

export class ApplicationNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('Application', id);
  }
}

export class ApplicationTokenNotFoundError extends NotFoundError {
  constructor() {
    super('Application token');
  }
}

export class ApplicationTokenExpiredError extends BadRequestError {
  constructor() {
    super('Application token has expired');
  }
}

export class ApplicationTokenUsedError extends BadRequestError {
  constructor() {
    super('Application token has already been used');
  }
}

export class InvalidApplicationTransitionError extends ConflictError {
  constructor(from: string, to: string) {
    super(`Cannot transition application from '${from}' to '${to}'`);
  }
}
