import { AggregateRoot, EntityProps, UUIDIdentifier } from 'src/shared';
import {
  ApplicationStatus,
  ApplicationToken,
  CreditTerm,
  Money,
  RevenueBand,
  TradeReference,
} from '../value-objects';
import {
  ApplicationDecidedEvent,
  ApplicationSentEvent,
  ApplicationSubmittedEvent,
} from '../events/application.events';
import {
  AiSummaryNotAvailableError,
  InvalidApplicationTransitionError,
} from '../errors/application.errors';

export interface ApplicationProps extends EntityProps {
  id: string;
  vendorId: string | null;
  status: ApplicationStatus;

  companyName: string | null;
  dba: string | null;
  country: string | null;
  website: string | null;
  revenueBand: RevenueBand | null;

  creditRequested: Money | null;
  creditTermRequested: CreditTerm | null;

  billingContactName: string | null;
  billingContactEmail: string | null;

  recipientName: string | null;
  recipientEmail: string | null;

  tradeReferences: TradeReference[];
  tokens: ApplicationToken[];

  aiSummary: string | null;

  decisionAmount: Money | null;
  decisionTerm: CreditTerm | null;
  rejectionReason: string | null;

  sentAt: Date | null;
  submittedAt: Date | null;
  decidedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationCreateInput = {
  vendorId?: string | null;
  companyName?: string | null;
  dba?: string | null;
  country?: string | null;
  website?: string | null;
  revenueBand?: RevenueBand | null;
  creditAmountRequested?: number | null;
  creditTermRequested?: CreditTerm | null;
  billingContactName?: string | null;
  billingContactEmail?: string | null;
  tradeReferences?: TradeReference[];
};

export type ApplicationPatchInput = ApplicationCreateInput;

const TOKEN_TTL_DAYS = 7;

export class ApplicationAggregate extends AggregateRoot<ApplicationProps> {
  public static create(input: ApplicationCreateInput): ApplicationAggregate {
    const now = new Date();
    return new ApplicationAggregate({
      id: UUIDIdentifier.generate().value,
      vendorId: input.vendorId ?? null,
      status: 'draft',
      companyName: input.companyName ?? null,
      dba: input.dba ?? null,
      country: input.country ?? null,
      website: input.website ?? null,
      revenueBand: input.revenueBand ?? null,
      creditRequested:
        typeof input.creditAmountRequested === 'number'
          ? Money.create(input.creditAmountRequested)
          : null,
      creditTermRequested: input.creditTermRequested ?? null,
      billingContactName: input.billingContactName ?? null,
      billingContactEmail: input.billingContactEmail ?? null,
      recipientName: null,
      recipientEmail: null,
      tradeReferences: input.tradeReferences ?? [],
      tokens: [],
      aiSummary: null,
      decisionAmount: null,
      decisionTerm: null,
      rejectionReason: null,
      sentAt: null,
      submittedAt: null,
      decidedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static restore(data: ApplicationProps): ApplicationAggregate {
    return new ApplicationAggregate(data);
  }

  // --- getters ---

  public get status(): ApplicationStatus {
    return this.props.status;
  }

  public get vendorId(): string | null {
    return this.props.vendorId;
  }

  public get billingContactEmail(): string | null {
    return this.props.billingContactEmail;
  }

  public get recipientEmail(): string | null {
    return this.props.recipientEmail;
  }

  public get tradeReferences(): TradeReference[] {
    return [...this.props.tradeReferences];
  }

  public get tokens(): ApplicationToken[] {
    return [...this.props.tokens];
  }

  // --- behavior ---

  public patchDraft(patch: ApplicationPatchInput): void {
    if (patch.vendorId !== undefined) this._props.vendorId = patch.vendorId ?? null;
    if (patch.companyName !== undefined) this._props.companyName = patch.companyName ?? null;
    if (patch.dba !== undefined) this._props.dba = patch.dba ?? null;
    if (patch.country !== undefined) this._props.country = patch.country ?? null;
    if (patch.website !== undefined) this._props.website = patch.website ?? null;
    if (patch.revenueBand !== undefined) this._props.revenueBand = patch.revenueBand ?? null;
    if (patch.creditTermRequested !== undefined) {
      this._props.creditTermRequested = patch.creditTermRequested ?? null;
    }
    if (patch.billingContactName !== undefined) {
      this._props.billingContactName = patch.billingContactName ?? null;
    }
    if (patch.billingContactEmail !== undefined) {
      this._props.billingContactEmail = patch.billingContactEmail ?? null;
    }
    if (patch.creditAmountRequested !== undefined) {
      this._props.creditRequested =
        typeof patch.creditAmountRequested === 'number'
          ? Money.create(patch.creditAmountRequested)
          : null;
    }
    if (patch.tradeReferences !== undefined) {
      this._props.tradeReferences = patch.tradeReferences;
    }
    this.markAsUpdated();
  }

  public send(input: { recipientName: string; recipientEmail: string }): ApplicationToken {
    if (this._props.status !== 'draft' && this._props.status !== 'sent') {
      throw new InvalidApplicationTransitionError(this._props.status, 'sent');
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + TOKEN_TTL_DAYS);

    const newToken: ApplicationToken = {
      id: UUIDIdentifier.generate().value,
      token: UUIDIdentifier.generate().value,
      expiresAt,
      usedAt: null,
      createdAt: now,
    };

    this._props.status = 'sent';
    this._props.recipientName = input.recipientName;
    this._props.recipientEmail = input.recipientEmail;
    this._props.sentAt = now;
    this._props.tokens = [...this._props.tokens, newToken];
    this.markAsUpdated();

    this.addDomainEvent(
      new ApplicationSentEvent(this._props.id, {
        applicationId: this._props.id,
        recipientName: input.recipientName,
        recipientEmail: input.recipientEmail,
        token: newToken,
        expiresAt,
      }),
    );

    return newToken;
  }

  public submit(token: ApplicationToken, patch: ApplicationPatchInput): void {
    if (this._props.status !== 'sent') {
      throw new InvalidApplicationTransitionError(this._props.status, 'submitted');
    }

    this.patchDraft(patch);

    const now = new Date();
    this._props.status = 'submitted';
    this._props.submittedAt = now;
    this._props.tokens = this._props.tokens.map((t) =>
      t.id === token.id ? { ...t, usedAt: now } : t,
    );
    this.markAsUpdated();

    this.addDomainEvent(
      new ApplicationSubmittedEvent(this._props.id, {
        applicationId: this._props.id,
        vendorId: this._props.vendorId,
        billingContactEmail: this._props.billingContactEmail,
        recipientEmail: this._props.recipientEmail,
        submittedAt: now,
      }),
    );
  }

  public decide(input: {
    action: 'approve' | 'approve_adjusted' | 'reject';
    decisionAmount?: number | null;
    decisionTerm?: CreditTerm | null;
    rejectionReason?: string | null;
  }): void {
    if (this._props.status !== 'submitted') {
      throw new InvalidApplicationTransitionError(this._props.status, input.action);
    }

    const now = new Date();
    if (input.action === 'reject') {
      this._props.status = 'rejected';
      this._props.rejectionReason = input.rejectionReason ?? null;
      this._props.decisionAmount = null;
      this._props.decisionTerm = null;
    } else {
      this._props.status = input.action === 'approve' ? 'approved' : 'approved_adjusted';
      this._props.decisionAmount =
        typeof input.decisionAmount === 'number' ? Money.create(input.decisionAmount) : null;
      this._props.decisionTerm = input.decisionTerm ?? null;
      this._props.rejectionReason = null;
    }
    this._props.decidedAt = now;
    this.markAsUpdated();

    this.addDomainEvent(
      new ApplicationDecidedEvent(this._props.id, {
        applicationId: this._props.id,
        action: input.action,
        decisionAmount: this._props.decisionAmount,
        decisionTerm: this._props.decisionTerm,
        rejectionReason: this._props.rejectionReason,
        decidedAt: now,
      }),
    );
  }

  public attachAiSummary(summary: string): void {
    if (this._props.status !== 'submitted') {
      throw new AiSummaryNotAvailableError();
    }
    this._props.aiSummary = summary;
    this.markAsUpdated();
  }

  protected validate(): void {
    if (!this._props.id) {
      throw new Error('Application.id is required');
    }
  }
}
