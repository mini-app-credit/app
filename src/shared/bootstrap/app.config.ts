import { z } from 'zod';

export const appConfigSchema = z.object({
  NAME: z.coerce.string().default('analyzer'),
  NODE_ENV: z.coerce.string().default('development'),
  PORT: z.coerce.number().default(3000),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export const load = {
  from: {
    env: (env: NodeJS.ProcessEnv) => {
      return appConfigSchema.parse(env);
    },
  },
};
