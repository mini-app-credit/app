import { DomainEvent } from "src/shared";
import { IAM_EVENT_NAMES } from "./iam-event-names";

export interface PasswordResetCompletedPayload {
  userId: string;
  accountId: string;
  email: string;
}

export class PasswordResetCompletedEvent extends DomainEvent<PasswordResetCompletedPayload> {
  constructor(aggregateId: string, payload: PasswordResetCompletedPayload) {
    super(IAM_EVENT_NAMES.PASSWORD_RESET_COMPLETED, aggregateId, payload, undefined, payload.userId);
  }
}
