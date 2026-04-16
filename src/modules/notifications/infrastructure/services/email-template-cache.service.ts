import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { EmailTemplate, EmailTemplateProps } from '../../domain/entities';

const CACHE_TTL_SECONDS = 300;

interface CachedRow extends Omit<EmailTemplateProps, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

function cacheKeyByEvent(eventName: string): string {
  return `email_tpl:event:${eventName}`;
}

function cacheKeyById(id: string): string {
  return `email_tpl:id:${id}`;
}

function rowToCache(row: EmailTemplateProps): CachedRow {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

function cacheToRow(cached: CachedRow): EmailTemplateProps {
  return { ...cached, createdAt: new Date(cached.createdAt), updatedAt: new Date(cached.updatedAt) };
}

export class EmailTemplateCacheService {
  private readonly logger = new Logger(EmailTemplateCacheService.name);

  constructor(private readonly redis: Redis) { }

  async get(eventName: string): Promise<EmailTemplate | null> {
    try {
      const raw = await this.redis.get(cacheKeyByEvent(eventName));
      if (!raw) return null;
      return EmailTemplate.restore(cacheToRow(JSON.parse(raw) as CachedRow));
    } catch {
      return null;
    }
  }

  async set(template: EmailTemplate): Promise<void> {
    try {
      const row = template.props;
      await Promise.all([
        this.redis.set(cacheKeyByEvent(row.eventName), JSON.stringify(rowToCache(row)), 'EX', CACHE_TTL_SECONDS),
        this.redis.set(cacheKeyById(row.id), row.eventName, 'EX', CACHE_TTL_SECONDS),
      ]);
    } catch (error) {
      this.logger.warn({ err: error }, 'Failed to set email template cache');
    }
  }

  async invalidate(eventName: string, id: string): Promise<void> {
    try {
      await this.redis.del(cacheKeyByEvent(eventName), cacheKeyById(id));
    } catch (error) {
      this.logger.warn({ err: error }, 'Failed to invalidate email template cache');
    }
  }

  async getEventNameById(id: string): Promise<string | null> {
    try {
      return await this.redis.get(cacheKeyById(id));
    } catch {
      return null;
    }
  }
}
