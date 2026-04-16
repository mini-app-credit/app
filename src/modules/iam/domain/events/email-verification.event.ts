import { DomainEvent } from "src/shared";
import { IAM_EVENT_NAMES } from "./iam-event-names";

export interface InvokeEmailVerificationPayload {
  userId: string;
  accountId: string;
  email: string;
  code: {
    value: string;
    expiresAt: Date;
  };
}

export class EmailVerificationEvent extends DomainEvent<InvokeEmailVerificationPayload> {
  constructor(aggregateId: string, payload: InvokeEmailVerificationPayload) {
    super(IAM_EVENT_NAMES.INVOKE_EMAIL_VERIFICATION, aggregateId, payload, undefined, payload.userId);
  }
}