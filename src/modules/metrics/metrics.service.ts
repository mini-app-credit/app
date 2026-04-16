import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Registry,
  Counter,
  Histogram,
} from 'prom-client';
import { METRICS_DI } from './metrics.constants';
import { MetricsConfig } from './metrics.config';

/**
 * Prometheus metric names only allow [a-zA-Z_:][a-zA-Z0-9_:]*.
 * Service NAME values often contain hyphens (e.g. mini-credit).
 */
function sanitizePrometheusMetricPrefix(name: string): string {
  const sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (sanitized.length === 0) {
    return 'app';
  }
  if (/^[0-9]/.test(sanitized)) {
    return `_${sanitized}`;
  }
  return sanitized;
}

export interface MetricsService {
  getMetrics(): Promise<string>;
  incrementHttpRequest(method: string, route: string, status: number): void;
  observeRequestDuration(
    method: string,
    route: string,
    status: number,
    durationSeconds: number,
  ): void;
  incrementRpcRequest(pattern: string): void;
  observeRpcDuration(pattern: string, durationSeconds: number): void;
  incrementRun(projectId: string, status: string): void;
  observeRunDuration(projectId: string, durationSeconds: number): void;
  incrementValidationIssues(projectId: string, issueType: string, severity: string): void;
  incrementReport(projectId: string, status: string): void;
  incrementReview(projectId: string, verdict: string): void;
}

@Injectable()
export class PrometheusServiceImpl implements MetricsService {
  private readonly register: Registry;
  private readonly logger: Logger = new Logger(PrometheusServiceImpl.name);

  private httpRequestCounter: Counter<string> | undefined;
  private httpRequestDurationHistogram: Histogram<string> | undefined;

  private rpcRequestCounter: Counter<string> | undefined;
  private rpcRequestDurationHistogram: Histogram<string> | undefined;

  private runsCounter: Counter<string> | undefined;
  private runDurationHistogram: Histogram<string> | undefined;
  private validationIssuesCounter: Counter<string> | undefined;
  private reportsCounter: Counter<string> | undefined;
  private reviewsCounter: Counter<string> | undefined;

  constructor(@Inject(METRICS_DI.CONFIG) private readonly cfg: MetricsConfig) {
    this.register = new Registry();

    collectDefaultMetrics({
      register: this.register,
      prefix: sanitizePrometheusMetricPrefix(this.cfg.NAME),
    });

    this.register.setDefaultLabels({
      name: this.cfg.NAME,
    });

    this.logger.log('Prometheus metrics initialized');

    this.initHttpMetrics();
    this.initRpcMetrics();
    this.initPipelineMetrics();
  }

  private initHttpMetrics() {
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpRequestDurationHistogram = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 40, 50, 100],
      registers: [this.register],
    });

    this.register.registerMetric(this.httpRequestCounter);
    this.register.registerMetric(this.httpRequestDurationHistogram);
  }

  private initRpcMetrics() {
    this.rpcRequestCounter = new Counter({
      name: 'rpc_requests_total',
      help: 'Total number of RPC/NATS requests',
      labelNames: ['pattern'],
      registers: [this.register],
    });

    this.rpcRequestDurationHistogram = new Histogram({
      name: 'rpc_request_duration_seconds',
      help: 'Duration of RPC/NATS requests in seconds',
      labelNames: ['pattern'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.register],
    });

    this.register.registerMetric(this.rpcRequestCounter);
    this.register.registerMetric(this.rpcRequestDurationHistogram);
  }

  private initPipelineMetrics() {
    this.runsCounter = new Counter({
      name: 'runs_total',
      help: 'Total validation runs',
      labelNames: ['project_id', 'status'],
      registers: [this.register],
    });

    this.runDurationHistogram = new Histogram({
      name: 'run_duration_seconds',
      help: 'End-to-end run processing time',
      labelNames: ['project_id'],
      buckets: [0.5, 1, 2, 5, 10, 30, 60, 120],
      registers: [this.register],
    });

    this.validationIssuesCounter = new Counter({
      name: 'validation_issues_total',
      help: 'Issues found by validation',
      labelNames: ['project_id', 'issue_type', 'severity'],
      registers: [this.register],
    });

    this.reportsCounter = new Counter({
      name: 'reports_total',
      help: 'Reports created',
      labelNames: ['project_id', 'status'],
      registers: [this.register],
    });

    this.reviewsCounter = new Counter({
      name: 'reviews_total',
      help: 'Reviews submitted',
      labelNames: ['project_id', 'verdict'],
      registers: [this.register],
    });

    this.register.registerMetric(this.runsCounter);
    this.register.registerMetric(this.runDurationHistogram);
    this.register.registerMetric(this.validationIssuesCounter);
    this.register.registerMetric(this.reportsCounter);
    this.register.registerMetric(this.reviewsCounter);
  }

  getClient(): Registry {
    return this.register;
  }
  getMetrics(): Promise<string> {
    return this.register.metrics();
  }
  incrementHttpRequest(method: string, route: string, status: number): void {
    this.httpRequestCounter?.labels(method, route, status.toString()).inc();
  }
  observeRequestDuration(
    method: string,
    route: string,
    status: number,
    durationSeconds: number,
  ): void {
    this.httpRequestDurationHistogram
      ?.labels(method, route, status.toString())
      .observe(durationSeconds);
  }
  incrementRpcRequest(pattern: string): void {
    this.rpcRequestCounter?.labels(pattern).inc();
  }
  observeRpcDuration(pattern: string, durationSeconds: number): void {
    this.rpcRequestDurationHistogram?.labels(pattern).observe(durationSeconds);
  }
  incrementRun(projectId: string, status: string): void {
    this.runsCounter?.labels(projectId, status).inc();
  }
  observeRunDuration(projectId: string, durationSeconds: number): void {
    this.runDurationHistogram?.labels(projectId).observe(durationSeconds);
  }
  incrementValidationIssues(projectId: string, issueType: string, severity: string): void {
    this.validationIssuesCounter?.labels(projectId, issueType, severity).inc();
  }
  incrementReport(projectId: string, status: string): void {
    this.reportsCounter?.labels(projectId, status).inc();
  }
  incrementReview(projectId: string, verdict: string): void {
    this.reviewsCounter?.labels(projectId, verdict).inc();
  }
}
