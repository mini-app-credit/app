import type { DomainEvent } from 'src/shared/core/domain/events/domain-event.base';
import type { UnitOfWork, AppRepositories } from 'src/shared/core/application/services/unit-of-work.service';
import type { EventPublisher } from 'src/shared/core/application/services/event-publisher.service';
import type { BaseRepository } from 'src/shared/core/application/repositories/base.repository';
import type { UUIDIdentifier } from 'src/shared';

export type { UnitOfWork, AppRepositories, EventPublisher, BaseRepository };

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SignInResponseBody {
  access?: { token: string; expiresAt: string };
  refresh?: { token: string; expiresAt: string };
  accessToken?: string;
  refreshToken?: string;
}

export interface ProjectResponseBody {
  id: string;
  name: string;
  templateId: string | null;
  activeRuleSetId: string | null;
  activeMappingId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RuleSetResponseBody {
  id: string;
  projectId: string;
  name: string;
  version: number;
  rules: Array<{
    id: string;
    ruleSetId: string;
    message: string;
    type: string;
    payload: Record<string, unknown>;
  }>;
}

export interface MappingResponseBody {
  id: string;
  projectId: string;
  fields: Array<{ id: string; mappingId: string; from: string; to: string }>;
}

export interface RunResponseBody {
  id: string;
  projectId: string;
  storageObjectId: string;
  status: 'pending' | 'done' | 'failed';
  reportId: string | null;
}

export interface ReportResponseBody {
  id: string;
  runId: string;
  projectId: string;
  status: 'pass' | 'fail';
  lastReviewId: string | null;
  issues: Array<{
    id: string;
    reportId: string;
    ruleId: string | null;
    field: string;
    message: string;
    status: 'ok' | 'fail';
  }>;
}

export interface ReviewResponseBody {
  id: string;
  reportId: string;
  authorId: string;
  verdict: 'approve' | 'reject';
  notes: string;
  overrideData: Record<string, unknown> | null;
  issues: Array<{
    id: string;
    reviewId: string;
    reportIssueId: string;
    type: 'rule' | 'field';
    status: 'ok' | 'fail';
    message: string;
  }>;
}

export interface PaginatedResponseBody<T> {
  data: T[];
  meta?: { total: number; pagination?: { total: number; limit: number; offset: number } };
  pagination?: { total: number; limit: number; offset: number };
}

export interface ErrorResponseBody {
  statusCode: number;
  message: string;
  error?: string;
  code?: number;
}

export interface HealthResponseBody {
  status: string;
  info?: Record<string, { status: string }>;
  error?: Record<string, { status: string; error?: unknown }>;
  details?: Record<string, { status: string }>;
}

export function extractTokens(body: SignInResponseBody): AuthTokens {
  return {
    accessToken: body.access?.token ?? body.accessToken ?? '',
    refreshToken: body.refresh?.token ?? body.refreshToken ?? '',
  };
}

export function extractPaginationTotal(body: PaginatedResponseBody<unknown>): number {
  return body.meta?.total ?? body.meta?.pagination?.total ?? body.pagination?.total ?? 0;
}

export class InMemoryEventPublisher implements EventPublisher {
  events: DomainEvent[] = [];
  async publish<T extends DomainEvent>(event: T): Promise<string> { this.events.push(event); return event.eventId; }
  async publishMany<T extends DomainEvent>(events: T[]): Promise<string[]> { this.events.push(...events); return events.map(e => e.eventId); }
}

export class InMemoryUnitOfWork implements UnitOfWork {
  constructor(private repos: Record<string, BaseRepository<unknown>>) {}
  async withTransaction<T>(cb: (repos: AppRepositories) => Promise<T>): Promise<T> {
    const map = new Map<string, BaseRepository<unknown>>();
    for (const [key, val] of Object.entries(this.repos)) {
      map.set(key, val);
    }
    return cb(map);
  }
}
