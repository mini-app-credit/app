import { InvalidStateTransitionError } from '../errors/invalid-state-transition.error';

export class StateMachine<S extends string> {
  constructor(private readonly transitions: Map<S, S[]>) {}

  canTransition(from: S, to: S): boolean {
    return this.transitions.get(from)?.includes(to) ?? false;
  }

  next(from: S, to: S): S {
    if (!this.canTransition(from, to)) {
      throw new InvalidStateTransitionError(from, to);
    }
    return to;
  }
}
