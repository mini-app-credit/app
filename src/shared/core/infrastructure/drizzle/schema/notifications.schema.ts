import { pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventName: varchar('event_name', { length: 255 }).notNull(),
  templatePath: varchar('template_path', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (tbl) => [
  uniqueIndex('uniq_email_templates_event_name').on(tbl.eventName),
]);
