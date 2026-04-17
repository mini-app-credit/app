import { relations } from "drizzle-orm";
import {
    pgTable, pgEnum, uuid, varchar, text, timestamp, integer, jsonb
} from "drizzle-orm/pg-core";
import { users } from "./iam.schema";

export const applicationStatusEnum = pgEnum('application_status', [
    'draft',
    'sent',
    'submitted',
    'approved',
    'approved_adjusted',
    'rejected',
]);

export const creditTermEnum = pgEnum('credit_term', [
    'net_10',
    'net_20',
    'net_30',
]);

export const revenueBandEnum = pgEnum('revenue_band', [
    'under_1m',
    '1m_10m',
    '10m_100m',
    '100m_250m',
    '250m_500m',
    'over_500m',
]);

export const applications = pgTable('applications', {
    id: uuid('id').primaryKey().defaultRandom(),

    status: applicationStatusEnum('status').notNull().default('draft'),

    companyName: varchar('company_name', { length: 255 }),
    dba: varchar('dba', { length: 255 }),
    country: varchar('country', { length: 100 }),
    website: varchar('website', { length: 500 }),
    revenueBand: revenueBandEnum('revenue_band'),

    creditAmountRequested: integer('credit_amount_requested'),
    creditTermRequested: creditTermEnum('credit_term_requested'),

    billingContactName: varchar('billing_contact_name', { length: 255 }),
    billingContactEmail: varchar('billing_contact_email', { length: 255 }),

    recipientName: varchar('recipient_name', { length: 255 }),
    recipientEmail: varchar('recipient_email', { length: 255 }),

    decisionAmount: integer('decision_amount'),
    decisionTerm: creditTermEnum('decision_term'),
    rejectionReason: text('rejection_reason'),

    aiSummary: text('ai_summary'),

    vendorId: uuid('vendor_id').references(() => users.id, { onDelete: 'set null' }),

    meta: jsonb('meta').default({}),

    sentAt: timestamp('sent_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tradeReferences = pgTable('trade_references', {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),

    businessName: varchar('business_name', { length: 255 }).notNull(),
    engagementStart: timestamp('engagement_start', { withTimezone: true }),
    engagementEnd: timestamp('engagement_end', { withTimezone: true }),
    contactName: varchar('contact_name', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPosition: varchar('contact_position', { length: 255 }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const applicationTokens = pgTable('application_tokens', {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),

    token: uuid('token').notNull().defaultRandom().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    usedAt: timestamp('used_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const applicationsRelations = relations(applications, ({ many }) => ({
    tradeReferences: many(tradeReferences),
    tokens: many(applicationTokens),
}));

export const tradeReferencesRelations = relations(tradeReferences, ({ one }) => ({
    application: one(applications, {
        fields: [tradeReferences.applicationId],
        references: [applications.id],
    }),
}));

export const applicationTokensRelations = relations(applicationTokens, ({ one }) => ({
    application: one(applications, {
        fields: [applicationTokens.applicationId],
        references: [applications.id],
    }),
}));
