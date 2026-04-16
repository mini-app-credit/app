import { DomainEvent } from "src/shared";
import { IAM_EVENT_NAMES } from "./iam-event-names";

export interface UserLoggedOutPayload {
  userId: string;
  logoutAt: Date;
}

export class UserLoggedOutEvent extends DomainEvent<UserLoggedOutPayload> {
  constructor(aggregateId: string, payload: UserLoggedOutPayload) {
    super(IAM_EVENT_NAMES.USER_LOGGED_OUT, aggregateId, payload, undefined, payload.userId);
  }
}
