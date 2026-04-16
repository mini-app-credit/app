import { z } from 'zod';
import { smtpConfigSchema } from './smtp.config';

export const templatesConfigSchema = z.object({
  TEMPLATES_SERVICE_URL: z.string().url(),
  TEMPLATES_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  EMAIL_VERIFY_URL_BASE: z.string().url().optional(),
  CLIENT_URL: z.string().url().optional(),
  API_BASE_URL: z.string().url().optional(),
});

export const notificationsConfigSchema = templatesConfigSchema.merge(smtpConfigSchema);

export type NotificationsConfig = z.infer<typeof notificationsConfigSchema>;

export const loadNotificationsConfig = {
  from: {
    env: (env: NodeJS.ProcessEnv) => notificationsConfigSchema.parse(env),
  },
};
