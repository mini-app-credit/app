import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { Database, SHARED_DI_TOKENS, applications, tradeReferences, applicationTokens } from 'src/shared';

export type ApplicationRow = typeof applications.$inferSelect;
export type TradeReferenceRow = typeof tradeReferences.$inferSelect;
export type ApplicationTokenRow = typeof applicationTokens.$inferSelect;

export type ApplicationWithRefs = ApplicationRow & {
  tradeReferences: TradeReferenceRow[];
  tokens: ApplicationTokenRow[];
};

export type TokenWithApplication = {
  token: ApplicationTokenRow;
  application: ApplicationWithRefs | null;
};

@Injectable()
export class ApplicationRepository {
  constructor(
    @Inject(SHARED_DI_TOKENS.DATABASE_CLIENT)
    private readonly db: Database,
  ) {}

  async findById(id: string): Promise<ApplicationWithRefs | undefined> {
    return this.db.query.applications.findFirst({
      where: eq(applications.id, id),
      with: { tradeReferences: true, tokens: true },
    });
  }

  async findByToken(token: string): Promise<TokenWithApplication | null> {
    const tokenRecord = await this.db.query.applicationTokens.findFirst({
      where: eq(applicationTokens.token, token),
    });

    if (!tokenRecord) return null;

    const application = await this.findById(tokenRecord.applicationId) ?? null;

    return { token: tokenRecord, application };
  }

  async findAll(filters: { status?: string; vendorId?: string } = {}): Promise<ApplicationWithRefs[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters.status) {
      conditions.push(eq(applications.status, filters.status as ApplicationRow['status']));
    }
    if (filters.vendorId) {
      conditions.push(eq(applications.vendorId, filters.vendorId));
    }

    return this.db.query.applications.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { tradeReferences: true, tokens: true },
      orderBy: [desc(applications.createdAt)],
    });
  }

  async create(
    data: typeof applications.$inferInsert,
    refs: Omit<typeof tradeReferences.$inferInsert, 'applicationId'>[] = [],
  ): Promise<ApplicationWithRefs> {
    return this.db.transaction(async (tx) => {
      const [app] = await tx.insert(applications).values(data).returning();

      if (refs.length) {
        await tx.insert(tradeReferences).values(
          refs.map((r) => ({ ...r, applicationId: app.id })),
        );
      }

      const result = await tx.query.applications.findFirst({
        where: eq(applications.id, app.id),
        with: { tradeReferences: true, tokens: true },
      });

      return result!;
    });
  }

  async update(
    id: string,
    data: Partial<typeof applications.$inferInsert>,
  ): Promise<ApplicationRow> {
    const [updated] = await this.db
      .update(applications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();

    return updated;
  }

  async replaceTradeRefs(
    applicationId: string,
    refs: Omit<typeof tradeReferences.$inferInsert, 'applicationId'>[],
  ): Promise<void> {
    await this.db.delete(tradeReferences).where(eq(tradeReferences.applicationId, applicationId));

    if (refs.length) {
      await this.db.insert(tradeReferences).values(
        refs.map((r) => ({ ...r, applicationId })),
      );
    }
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(applications).where(eq(applications.id, id));
  }

  async createToken(applicationId: string, expiresAt?: Date): Promise<ApplicationTokenRow> {
    const [token] = await this.db
      .insert(applicationTokens)
      .values({ applicationId, expiresAt })
      .returning();

    return token;
  }

  async markTokenUsed(token: string): Promise<void> {
    await this.db
      .update(applicationTokens)
      .set({ usedAt: new Date() })
      .where(eq(applicationTokens.token, token));
  }
}
