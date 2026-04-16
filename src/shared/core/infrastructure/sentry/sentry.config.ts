import { z } from 'zod';

export const sentryConfigSchema = z.object({
  SENTRY_DSN: z.string().url().min(1).default('https://placeholder@sentry.io/1'),
  SENTRY_ENVIRONMENT: z.string().default('development'),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_SEND_DEFAULT_PII: z.boolean().default(false),
  SENTRY_TRACES_SAMPLE_RATE: z.number().min(0).max(1).default(0.2),
  SENTRY_PROFILES_SAMPLE_RATE: z.number().min(0).max(1).default(0.2),
  SENTRY_DEBUG: z.boolean().default(false),
  SENTRY_ENABLED: z.boolean().default(false),
  SENTRY_IGNORED_ROUTES: z.array(z.string()).optional(),
});

export type SentryConfig = z.infer<typeof sentryConfigSchema>;

export const loadSentryConfig = {
  from: {
    env: (env: NodeJS.ProcessEnv): SentryConfig => {
      const tracesSampleRate = env.SENTRY_TRACES_SAMPLE_RATE
        ? parseFloat(env.SENTRY_TRACES_SAMPLE_RATE)
        : 0.2;
      const profilesSampleRate = env.SENTRY_PROFILES_SAMPLE_RATE
        ? parseFloat(env.SENTRY_PROFILES_SAMPLE_RATE)
        : 0.2;

      const config: SentryConfig = {
        SENTRY_DSN: env.SENTRY_DSN || 'https://placeholder@sentry.io/1',
        SENTRY_ENVIRONMENT: env.SENTRY_ENVIRONMENT || 'development',
        SENTRY_RELEASE: env.SENTRY_RELEASE,
        SENTRY_SEND_DEFAULT_PII: env.SENTRY_SEND_DEFAULT_PII === 'true',
        SENTRY_TRACES_SAMPLE_RATE: tracesSampleRate,
        SENTRY_PROFILES_SAMPLE_RATE: profilesSampleRate,
        SENTRY_DEBUG: env.SENTRY_DEBUG === 'true',
        SENTRY_ENABLED: env.SENTRY_ENABLED === 'true',
        SENTRY_IGNORED_ROUTES: env.SENTRY_IGNORED_ROUTES?.split(',') || [
          '/health',
        ],
      };

      return loadSentryConfig.from.row(config);
    },
    row: (config: SentryConfig): SentryConfig => {
      return sentryConfigSchema.parse(config);
    },
  },
};
