import { DomainEvent } from "src/shared";
import { IAM_EVENT_NAMES } from "./iam-event-names";
import { ProviderPrimitive } from "../value-objects";

export interface UserLoggedInPayload {
  userId: string;
  email: string;
  provider: ProviderPrimitive;
  loginAt: Date;
}

export class UserLoggedInEvent extends DomainEvent<UserLoggedInPayload> {
  constructor(aggregateId: string, payload: UserLoggedInPayload) {
    super(IAM_EVENT_NAMES.USER_LOGGED_IN, aggregateId, payload, undefined, payload.userId);
  }
}
