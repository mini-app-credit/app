import z from 'zod';

export const natsConfigSchema = z.object({
  NATS_SERVERS: z.string().array().min(1),
  NATS_QUEUE_NAME: z.string(),
});

export type NatsConfig = z.infer<typeof natsConfigSchema>;

export const loadNatsConfig = {
  from: {
    env: (env: NodeJS.ProcessEnv) => {
      const config: NatsConfig = {
        NATS_SERVERS: env.NATS_SERVERS?.split(',') || [],
        NATS_QUEUE_NAME: env.NATS_QUEUE_NAME || 'core-queue',
      };

      return loadNatsConfig.from.raw(config);
    },
    raw: (raw: NatsConfig) => {
      const config = natsConfigSchema.parse(raw);
      return config;
    },
  },
};
