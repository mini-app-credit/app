import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { ExtractTablesWithRelations } from "drizzle-orm";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

export type PostgresTransaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type BaseOptions = {
  transaction?: PostgresTransaction;
}

// Executor that can be either the root database or a scoped transaction
export type DbExecutor = Database | PostgresTransaction;

// Drizzle Postgres transaction config (subset) to expose in shared APIs
export type PostgresTransactionConfig = {
  isolationLevel?:
    | 'read uncommitted'
    | 'read committed'
    | 'repeatable read'
    | 'serializable';
  accessMode?: 'read only' | 'read write';
  deferrable?: boolean;
};