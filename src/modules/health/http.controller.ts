import { Controller, Get, Inject } from '@nestjs/common';
import { HEALTH_DI } from './health.constants';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { DbIndicator, RedisIndicator, NatsIndicator, S3Indicator } from './indicators';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('health')
export class HttpHealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    @Inject(HEALTH_DI.DB_INDICATOR) private readonly dbIndicator: DbIndicator,
    @Inject(HEALTH_DI.REDIS_INDICATOR) private readonly redisIndicator: RedisIndicator,
    @Inject(HEALTH_DI.NATS_INDICATOR) private readonly natsIndicator: NatsIndicator,
    @Inject(HEALTH_DI.S3_INDICATOR) private readonly s3Indicator: S3Indicator,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('startup')
  @ApiOperation({ summary: 'Startup probe' })
  @HealthCheck()
  startup() {
    return this.health.check([
      async () => this.dbIndicator.pingCheck('database'),
      async () => this.redisIndicator.pingCheck('redis'),
    ]);
  }

  @Get()
  @ApiOperation({ summary: 'Readiness probe' })
  @HealthCheck()
  readiness() {
    return this.health.check([
      async () => this.dbIndicator.pingCheck('database'),
      async () => this.redisIndicator.pingCheck('redis'),
      async () => this.natsIndicator.pingCheck('nats'),
      async () => this.s3Indicator.pingCheck('s3'),
    ]);
  }

  @Get('deep')
  @ApiOperation({ summary: 'Deep health check with memory and detailed status' })
  @HealthCheck()
  deep() {
    return this.health.check([
      async () => this.dbIndicator.pingCheck('database'),
      async () => this.redisIndicator.pingCheck('redis'),
      async () => this.natsIndicator.pingCheck('nats'),
      async () => this.s3Indicator.pingCheck('s3'),
      async () => this.memory.checkHeap('memory_heap', 400 * 1024 * 1024),
      async () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),
    ]);
  }
}
