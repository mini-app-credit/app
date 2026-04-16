import { DomainEvent } from "src/shared";
import { IAM_EVENT_NAMES } from "./iam-event-names";
import { EmailPrimitive, ProviderPrimitive } from "../value-objects";

export interface UserSignUpPayload {
  userId: string;
  email: EmailPrimitive | null;
  provider: ProviderPrimitive;
  createdAt: Date;
}

export class UserSignUpEvent extends DomainEvent<UserSignUpPayload> {
  constructor(aggregateId: string, payload: UserSignUpPayload) {
    super(IAM_EVENT_NAMES.USER_SIGN_UP, aggregateId, payload, undefined, payload.userId);
  }

  get loadUserId(): string {
    return this.payload.userId;
  }

  get email(): EmailPrimitive | null {
    return this.payload.email;
  }

  get provider(): ProviderPrimitive {
    return this.payload.provider;
  }

  get createdAt(): Date {
    return this.payload.createdAt;
  }
}
