import { Logger } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { BaseRepository, Database, PostgresTransaction, UUIDIdentifier } from 'src/shared';
import { emailTemplates } from 'src/shared/core/infrastructure/drizzle/schema';
import { EmailTemplate } from '../../domain/entities';
import { EmailTemplatesRepository } from '../../domain/repositories';
import { EmailTemplateCacheService } from '../services/email-template-cache.service';

export class EmailTemplatesRepositoryImpl implements EmailTemplatesRepository {
  private readonly logger = new Logger(EmailTemplatesRepositoryImpl.name);
  private readonly table = emailTemplates;

  constructor(
    private readonly db: Database | PostgresTransaction,
    private readonly cache?: EmailTemplateCacheService,
  ) { }

  bind(tx: PostgresTransaction): BaseRepository<EmailTemplate> {
    return new EmailTemplatesRepositoryImpl(tx, this.cache);
  }

  async insert(template: EmailTemplate): Promise<EmailTemplate> {
    try {
      const result = await this.db.insert(this.table).values(template.props).returning();
      const inserted = EmailTemplate.restore(result[0]);
      await this.cache?.set(inserted);
      return inserted;
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to insert email template');
      throw error;
    }
  }

  async findById(id: UUIDIdentifier): Promise<EmailTemplate | null> {
    const row = await this.db.query.emailTemplates.findFirst({
      where: eq(this.table.id, id.toString()),
    });
    return row ? EmailTemplate.restore(row) : null;
  }

  async findByEventName(eventName: string): Promise<EmailTemplate | null> {
    const cached = await this.cache?.get(eventName);
    if (cached) return cached;

    const row = await this.db.query.emailTemplates.findFirst({
      where: eq(this.table.eventName, eventName),
    });
    if (!row) return null;

    const template = EmailTemplate.restore(row);
    await this.cache?.set(template);
    return template;
  }

  async list(limit: number = 50, offset: number = 0): Promise<EmailTemplate[]> {
    const rows = await this.db
      .select()
      .from(this.table)
      .orderBy(desc(this.table.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => EmailTemplate.restore(row));
  }

  async update(template: EmailTemplate): Promise<EmailTemplate> {
    const p = template.props;
    const oldEventName = await this.cache?.getEventNameById(p.id) ?? null;

    const result = await this.db
      .update(this.table)
      .set({
        eventName: p.eventName,
        templatePath: p.templatePath,
        updatedAt: p.updatedAt,
      })
      .where(eq(this.table.id, p.id))
      .returning();

    if (!result.length) {
      throw new Error(`Failed to update template ${p.id}`);
    }

    const updated = EmailTemplate.restore(result[0]);

    if (oldEventName && oldEventName !== p.eventName) {
      await this.cache?.invalidate(oldEventName, p.id);
    }
    await this.cache?.set(updated);

    return updated;
  }

  async deleteById(id: UUIDIdentifier): Promise<void> {
    const idStr = id.toString();
    const oldEventName = await this.cache?.getEventNameById(idStr) ?? null;
    if (oldEventName) {
      await this.cache?.invalidate(oldEventName, idStr);
    }
    await this.db.delete(this.table).where(eq(this.table.id, idStr));
  }
}
