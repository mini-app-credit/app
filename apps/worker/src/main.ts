import 'src/shared/core/infrastructure/drizzle/load-env';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import * as process from 'node:process';
import { WorkerAppModule } from './app/worker-app.module';
import { AppConfig, DI_TOKENS } from 'src/shared';
import 'src/shared/core/infrastructure/sentry/instrument';
import * as Sentry from '@sentry/node';

const SHUTDOWN_TIMEOUT_MS = 30_000;
let isShuttingDown = false;

const DEFAULT_WORKER_PORT = 3001;

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
    logger.log('Worker closed gracefully');
    clearTimeout(shutdownTimer);
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error instanceof Error ? error.message : 'Unknown'}`);
    clearTimeout(shutdownTimer);
    process.exit(1);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(WorkerAppModule, { bufferLogs: true, snapshot: true });
  const logger = app.get<Logger>(Logger);

  app.useLogger(logger);
  app.enableShutdownHooks();

  const config = app.get<AppConfig>(DI_TOKENS.CONFIG);

  const workerPort = Number(process.env.WORKER_PORT) || DEFAULT_WORKER_PORT;

  logger.log('bootstrap.modules.selected worker: SharedModule, IamModule.forWorker, StorageModule.forWorker, NotificationsModule');

  await app.listen(workerPort, '0.0.0.0');

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

  logger.log(`[${config.NAME}] worker is running on [${config.NODE_ENV}] mode. URL: ${url}`);
}

void bootstrap();
