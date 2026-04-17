import { relations } from "drizzle-orm";
import { integer, jsonb, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { AccountMetaProps, ProviderPrimitive } from "src/modules/iam/domain";

export const userRoleEnum = pgEnum('user_role', [
  'vendor',
  'recipient',
]);


export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitAmount: integer('unit_amount').notNull().default(10000),
  role: userRoleEnum('role').notNull().default('vendor'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 40 }).$type<ProviderPrimitive>().notNull(),
  subject: varchar('subject', { length: 100 }).notNull(),
  meta: jsonb('meta').$type<AccountMetaProps>().notNull().default({}),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));
