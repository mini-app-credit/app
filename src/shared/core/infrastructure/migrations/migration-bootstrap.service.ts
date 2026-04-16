import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { SHARED_DI_TOKENS } from '../constants';
import { Database } from '../drizzle';

/** Advisory lock id — serializes migration runs across api/worker replicas. */
const MIGRATION_LOCK_KEY = 0x4d49_4752; // 'MIGR' in hex-ish

type QueryWithRows = {
  rows?: unknown[];
};

function hasRows(result: unknown): result is QueryWithRows {
  return typeof result === 'object' && result !== null && 'rows' in result;
}

@Injectable()
export class MigrationBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigrationBootstrapService.name);

  constructor(
    @Inject(SHARED_DI_TOKENS.DATABASE_CLIENT)
    private readonly db: Database,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const migrationsDir = path.resolve(process.cwd(), 'migrations');

    let sqlFiles: string[];
    try {
      const entries = await fs.readdir(migrationsDir);
      sqlFiles = entries
        .filter((f) => f.endsWith('.sql'))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    } catch {
      this.logger.warn(`Migrations directory not found: ${migrationsDir}`);
      return;
    }

    if (sqlFiles.length === 0) {
      this.logger.debug('No .sql files in migrations/');
      return;
    }

    await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`);

      await tx.execute(sql`
        CREATE TABLE IF NOT EXISTS app_migrations (
          name varchar(255) PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      for (const fileName of sqlFiles) {
        const migrationPath = path.join(migrationsDir, fileName);

        const checkResult = await tx.execute(
          sql`SELECT name FROM app_migrations WHERE name = ${fileName} LIMIT 1`,
        );

        if (hasRows(checkResult) && Array.isArray(checkResult.rows) && checkResult.rows.length > 0) {
          this.logger.debug(`Migration already applied: ${fileName}`);
          continue;
        }

        let migrationSql: string;
        try {
          migrationSql = (await fs.readFile(migrationPath, 'utf-8')).trim();
        } catch {
          this.logger.warn(`Migration file not readable: ${migrationPath}`);
          continue;
        }

        if (!migrationSql) {
          this.logger.warn(`Empty migration file, marking applied: ${fileName}`);
          await tx.execute(sql`INSERT INTO app_migrations (name) VALUES (${fileName})`);
          continue;
        }

        await tx.execute(sql.raw(migrationSql));
        await tx.execute(sql`INSERT INTO app_migrations (name) VALUES (${fileName})`);
        this.logger.log(`Applied migration: ${fileName}`);
      }
    });
  }
}
