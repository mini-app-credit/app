import { DomainEvent } from "src/shared";
import { IAM_EVENT_NAMES } from "./iam-event-names";

export interface EmailVerifiedPayload {
  userId: string;
  accountId: string;
  email: string;
  verifiedAt: Date;
}

export class EmailVerifiedEvent extends DomainEvent<EmailVerifiedPayload> {
  constructor(aggregateId: string, payload: EmailVerifiedPayload) {
    super(IAM_EVENT_NAMES.EMAIL_VERIFIED, aggregateId, payload, undefined, payload.userId);
  }
}
