import * as Sentry from '@sentry/nestjs';
import '../drizzle/load-env';
import { loadSentryConfig } from './sentry.config';

const config = loadSentryConfig.from.env(process.env);

Sentry.init({
  dsn: config.SENTRY_DSN,
  environment: config.SENTRY_ENVIRONMENT,
  release: config.SENTRY_RELEASE,
  sendDefaultPii: config.SENTRY_SEND_DEFAULT_PII,
  tracesSampleRate: config.SENTRY_TRACES_SAMPLE_RATE,
  profilesSampleRate: config.SENTRY_PROFILES_SAMPLE_RATE,
  debug: config.SENTRY_DEBUG,
  enabled: config.SENTRY_ENABLED,
  beforeSendTransaction(transaction) {
    const transactionName = transaction.transaction;

    if (!transactionName) {
      return transaction;
    }

    if (!config.SENTRY_IGNORED_ROUTES) {
      return transaction;
    }

    const ignoredRoutes = config.SENTRY_IGNORED_ROUTES.map((route) =>
      route.toLowerCase(),
    );

    const isIgnoredRoute = ignoredRoutes.some((route) =>
      transactionName.includes(route),
    );

    if (isIgnoredRoute) {
      return null;
    }

    return transaction;
  },
});
