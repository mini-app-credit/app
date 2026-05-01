import { applications, applicationTokens, tradeReferences } from 'src/shared';
import { ApplicationAggregate } from '../../domain/aggregates/application.aggregate';
import {
  ApplicationStatus,
  ApplicationToken,
  CreditTerm,
  Money,
  RevenueBand,
  TradeReference,
} from '../../domain/value-objects';

type ApplicationRow = typeof applications.$inferSelect;
type TradeReferenceRow = typeof tradeReferences.$inferSelect;
type ApplicationTokenRow = typeof applicationTokens.$inferSelect;

export type ApplicationRowWithRelations = ApplicationRow & {
  tradeReferences: TradeReferenceRow[];
  tokens: ApplicationTokenRow[];
};

export class ApplicationMapper {
  static toDomain(row: ApplicationRowWithRelations): ApplicationAggregate {
    return ApplicationAggregate.restore({
      id: row.id,
      vendorId: row.vendorId ?? null,
      status: row.status as ApplicationStatus,
      companyName: row.companyName ?? null,
      dba: row.dba ?? null,
      country: row.country ?? null,
      website: row.website ?? null,
      revenueBand: (row.revenueBand as RevenueBand | null) ?? null,
      creditRequested:
        typeof row.creditAmountRequested === 'number'
          ? Money.create(row.creditAmountRequested)
          : null,
      creditTermRequested: (row.creditTermRequested as CreditTerm | null) ?? null,
      billingContactName: row.billingContactName ?? null,
      billingContactEmail: row.billingContactEmail ?? null,
      recipientName: row.recipientName ?? null,
      recipientEmail: row.recipientEmail ?? null,
      tradeReferences: (row.tradeReferences ?? []).map((r) =>
        TradeReference.create({
          businessName: r.businessName,
          engagementStart: r.engagementStart,
          engagementEnd: r.engagementEnd,
          contactName: r.contactName,
          contactEmail: r.contactEmail,
          contactPosition: r.contactPosition,
        }),
      ),
      tokens: (row.tokens ?? []).map<ApplicationToken>((t) => ({
        id: t.id,
        token: t.token,
        expiresAt: t.expiresAt ?? new Date(0),
        usedAt: t.usedAt ?? null,
        createdAt: t.createdAt,
      })),
      aiSummary: row.aiSummary ?? null,
      decisionAmount:
        typeof row.decisionAmount === 'number' ? Money.create(row.decisionAmount) : null,
      decisionTerm: (row.decisionTerm as CreditTerm | null) ?? null,
      rejectionReason: row.rejectionReason ?? null,
      sentAt: row.sentAt ?? null,
      submittedAt: row.submittedAt ?? null,
      decidedAt: row.decidedAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(agg: ApplicationAggregate): typeof applications.$inferInsert {
    const p = agg.props;
    return {
      id: p.id,
      vendorId: p.vendorId ?? undefined,
      status: p.status,
      companyName: p.companyName ?? undefined,
      dba: p.dba ?? undefined,
      country: p.country ?? undefined,
      website: p.website ?? undefined,
      revenueBand: p.revenueBand ?? undefined,
      creditAmountRequested: p.creditRequested?.value.amount ?? undefined,
      creditTermRequested: p.creditTermRequested ?? undefined,
      billingContactName: p.billingContactName ?? undefined,
      billingContactEmail: p.billingContactEmail ?? undefined,
      recipientName: p.recipientName ?? undefined,
      recipientEmail: p.recipientEmail ?? undefined,
      aiSummary: p.aiSummary ?? undefined,
      decisionAmount: p.decisionAmount?.value.amount ?? undefined,
      decisionTerm: p.decisionTerm ?? undefined,
      rejectionReason: p.rejectionReason ?? undefined,
      sentAt: p.sentAt ?? undefined,
      submittedAt: p.submittedAt ?? undefined,
      decidedAt: p.decidedAt ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  static tradeRefsToPersistence(
    agg: ApplicationAggregate,
  ): Omit<typeof tradeReferences.$inferInsert, 'applicationId'>[] {
    return agg.tradeReferences.map((r) => {
      const props = r.value;
      return {
        businessName: props.businessName,
        engagementStart: props.engagementStart,
        engagementEnd: props.engagementEnd,
        contactName: props.contactName,
        contactEmail: props.contactEmail,
        contactPosition: props.contactPosition,
      };
    });
  }

  static tokensToPersistence(
    agg: ApplicationAggregate,
  ): Omit<typeof applicationTokens.$inferInsert, 'applicationId'>[] {
    return agg.tokens.map((t) => ({
      id: t.id,
      token: t.token,
      expiresAt: t.expiresAt,
      usedAt: t.usedAt ?? undefined,
      createdAt: t.createdAt,
    }));
  }

  static toPublicDto(agg: ApplicationAggregate) {
    const p = agg.props;
    return {
      id: p.id,
      vendorId: p.vendorId,
      status: p.status,
      companyName: p.companyName,
      dba: p.dba,
      country: p.country,
      website: p.website,
      revenueBand: p.revenueBand,
      creditAmountRequested: p.creditRequested?.value.amount ?? null,
      creditTermRequested: p.creditTermRequested,
      billingContactName: p.billingContactName,
      billingContactEmail: p.billingContactEmail,
      recipientName: p.recipientName,
      recipientEmail: p.recipientEmail,
      tradeReferences: p.tradeReferences.map((r) => r.value),
      aiSummary: p.aiSummary,
      decisionAmount: p.decisionAmount?.value.amount ?? null,
      decisionTerm: p.decisionTerm,
      rejectionReason: p.rejectionReason,
      sentAt: p.sentAt,
      submittedAt: p.submittedAt,
      decidedAt: p.decidedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
