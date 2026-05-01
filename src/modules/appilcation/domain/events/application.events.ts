import { DomainEvent } from 'src/shared';
import { APPLICATION_EVENT_NAMES } from './application-event-names';
import type { ApplicationToken, CreditTerm, Money } from '../value-objects';

export interface ApplicationSentPayload {
  applicationId: string;
  recipientName: string;
  recipientEmail: string;
  token: ApplicationToken;
  expiresAt: Date;
}

export class ApplicationSentEvent extends DomainEvent<ApplicationSentPayload> {
  constructor(aggregateId: string, payload: ApplicationSentPayload) {
    super(APPLICATION_EVENT_NAMES.APPLICATION_SENT, aggregateId, payload);
  }
}

export interface ApplicationSubmittedPayload {
  applicationId: string;
  vendorId: string | null;
  billingContactEmail: string | null;
  recipientEmail: string | null;
  submittedAt: Date;
}

export class ApplicationSubmittedEvent extends DomainEvent<ApplicationSubmittedPayload> {
  constructor(aggregateId: string, payload: ApplicationSubmittedPayload) {
    super(APPLICATION_EVENT_NAMES.APPLICATION_SUBMITTED, aggregateId, payload);
  }
}

export interface ApplicationDecidedPayload {
  applicationId: string;
  action: 'approve' | 'approve_adjusted' | 'reject';
  decisionAmount: Money | null;
  decisionTerm: CreditTerm | null;
  rejectionReason: string | null;
  decidedAt: Date;
}

export class ApplicationDecidedEvent extends DomainEvent<ApplicationDecidedPayload> {
  constructor(aggregateId: string, payload: ApplicationDecidedPayload) {
    super(APPLICATION_EVENT_NAMES.APPLICATION_DECIDED, aggregateId, payload);
  }
}
