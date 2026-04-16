import { DomainEvent } from "src/shared";
import { IAM_EVENT_NAMES } from "./iam-event-names";

export interface PasswordResetRequestedPayload {
  userId: string;
  accountId: string;
  email: string;
  code: {
    value: string;
    expiresAt: Date;
  };
}

export class PasswordResetRequestedEvent extends DomainEvent<PasswordResetRequestedPayload> {
  constructor(aggregateId: string, payload: PasswordResetRequestedPayload) {
    super(IAM_EVENT_NAMES.PASSWORD_RESET_REQUESTED, aggregateId, payload, undefined, payload.userId);
  }
}
