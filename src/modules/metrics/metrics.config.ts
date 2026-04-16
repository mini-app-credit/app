import { z } from 'zod';

export const metricsConfigSchema = z.object({
  NAME: z.string(),
});

export type MetricsConfig = z.infer<typeof metricsConfigSchema>;

export const load = {
  from: {
    env: (env: NodeJS.ProcessEnv) => {
      const cfg: MetricsConfig = {
        NAME: env.NAME!,
      };

      return cfg;
    },
    row: (cfg: MetricsConfig) => {
      return metricsConfigSchema.parse(cfg);
    },
  },
};
