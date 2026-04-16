import 'src/shared/core/infrastructure/drizzle/load-env';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ApiAppModule } from './app/api-app.module';
import { AppConfig, DI_TOKENS } from 'src/shared';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as process from 'node:process';
import { Swagger } from 'src/shared';
import 'src/shared/core/infrastructure/sentry/instrument';
import * as Sentry from '@sentry/node';

const SHUTDOWN_TIMEOUT_MS = 30_000;
let isShuttingDown = false;

async function gracefulShutdown(app: INestApplication, logger: Logger, signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress, ignoring ${signal}`);
    return;
  }

  isShuttingDown = true;

  logger.log(`Received ${signal}, starting graceful shutdown...`);

  const shutdownTimer = setTimeout(() => {
    logger.error('Shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    await app.close();
    logger.log('Application closed gracefully');
    clearTimeout(shutdownTimer);
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error instanceof Error ? error.message : 'Unknown'}`);
    clearTimeout(shutdownTimer);
    process.exit(1);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(ApiAppModule, { bufferLogs: true, snapshot: true });
  const logger = app.get<Logger>(Logger);

  app.useLogger(logger);
  app.enableShutdownHooks();
  Swagger.apply(app);
  app.use(helmet());

  const config = app.get<AppConfig>(DI_TOKENS.CONFIG);

  logger.log('bootstrap.modules.selected api: SharedModule, MetricsModule, HealthModule, IamModule.forApi, StorageModule.forApi');

  await app.listen(config.PORT, '0.0.0.0');

  const url = await app.getUrl();

  process.on('SIGTERM', () => void gracefulShutdown(app, logger, 'SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown(app, logger, 'SIGINT'));

  process.on('uncaughtException', async (err: Error) => {
    logger.error(`uncaughtException: ${err?.message}`, err?.stack);
    Sentry.captureException(err);
    await Sentry.flush(2000);
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason: unknown) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logger.error(`unhandledRejection: ${err?.message}`, err?.stack);
    Sentry.captureException(err);
    await Sentry.flush(2000);
    process.exit(1);
  });

  logger.log(`[${config.NAME}] api is running on [${config.NODE_ENV}] mode. URL: ${url}`);
}

void bootstrap();
