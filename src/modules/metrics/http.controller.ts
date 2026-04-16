import { Controller, Get, Inject, Res } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { Response } from 'express';
import { METRICS_DI } from './metrics.constants';
import { ApiTags } from '@nestjs/swagger';

@Controller('metrics')
@ApiTags('metrics')
export class MetricsHttpController {
  constructor(
    @Inject(METRICS_DI.SERVICE) private readonly metricsService: MetricsService,
  ) { }
  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    const metrics = await this.metricsService.getMetrics();

    res.set('Content-Type', 'text/plain');

    res.send(metrics);
  }
}
