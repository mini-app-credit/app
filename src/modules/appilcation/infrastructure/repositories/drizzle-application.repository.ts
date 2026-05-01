import { and, desc, eq } from 'drizzle-orm';
import {
  applications,
  applicationTokens,
  Database,
  tradeReferences,
  UUIDIdentifier,
} from 'src/shared';
import {
  ApplicationAggregate,
  ApplicationRepository,
  ApplicationStatus,
} from '../../domain';
import {
  ApplicationMapper,
  ApplicationRowWithRelations,
} from '../../application/mappers/application.mapper';

export class DrizzleApplicationRepository implements ApplicationRepository {
  constructor(private readonly db: Database) {}

  async findById(id: UUIDIdentifier): Promise<ApplicationAggregate | null> {
    const row = (await this.db.query.applications.findFirst({
      where: eq(applications.id, id.toString()),
      with: { tradeReferences: true, tokens: true },
    })) as ApplicationRowWithRelations | undefined;

    return row ? ApplicationMapper.toDomain(row) : null;
  }

  async findByToken(token: string): Promise<ApplicationAggregate | null> {
    const tokenRow = await this.db.query.applicationTokens.findFirst({
      where: eq(applicationTokens.token, token),
    });
    if (!tokenRow) return null;
    return this.findById(UUIDIdentifier.create(tokenRow.applicationId));
  }

  async findAll(filters: {
    status?: ApplicationStatus;
    vendorId?: string;
  }): Promise<ApplicationAggregate[]> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (filters.status) conditions.push(eq(applications.status, filters.status));
    if (filters.vendorId) conditions.push(eq(applications.vendorId, filters.vendorId));

    const rows = (await this.db.query.applications.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { tradeReferences: true, tokens: true },
      orderBy: [desc(applications.createdAt)],
    })) as ApplicationRowWithRelations[];

    return rows.map(ApplicationMapper.toDomain);
  }

  async save(agg: ApplicationAggregate): Promise<ApplicationAggregate> {
    const row = ApplicationMapper.toPersistence(agg);
    const refs = ApplicationMapper.tradeRefsToPersistence(agg);
    const tokens = ApplicationMapper.tokensToPersistence(agg);

    await this.db.transaction(async (tx) => {
      await tx
        .insert(applications)
        .values(row)
        .onConflictDoUpdate({
          target: applications.id,
          set: { ...row, updatedAt: new Date() },
        });

      await tx
        .delete(tradeReferences)
        .where(eq(tradeReferences.applicationId, row.id!));
      if (refs.length) {
        await tx
          .insert(tradeReferences)
          .values(refs.map((r) => ({ ...r, applicationId: row.id! })));
      }

      for (const t of tokens) {
        await tx
          .insert(applicationTokens)
          .values({ ...t, applicationId: row.id! })
          .onConflictDoUpdate({
            target: applicationTokens.id,
            set: { usedAt: t.usedAt, expiresAt: t.expiresAt },
          });
      }
    });

    const reloaded = await this.findById(UUIDIdentifier.create(row.id!));
    if (!reloaded) throw new Error('Saved application disappeared on reload');
    agg.clearDomainEvents();
    return reloaded;
  }

  async delete(id: UUIDIdentifier): Promise<void> {
    await this.db.delete(applications).where(eq(applications.id, id.toString()));
  }
}
