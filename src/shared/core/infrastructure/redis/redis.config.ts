import z from 'zod';

export const redisConfigSchema = z.object({
  REDIS_HOST: z.string().optional().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DATABASE: z.number().optional().default(0),
  REDIS_TLS: z.boolean().optional(),
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;

export const loadRedisConfig = {
  from: {
    env: (env: NodeJS.ProcessEnv) => {
      const cfg: RedisConfig = {
        REDIS_HOST: env.REDIS_HOST!,
        REDIS_PORT: Number(env.REDIS_PORT! ?? '6379'),
        REDIS_DATABASE: Number(env.REDIS_DATABASE! ?? '0'),
        REDIS_USERNAME: env.REDIS_USERNAME,
        REDIS_PASSWORD: env.REDIS_PASSWORD,
        REDIS_TLS: env.REDIS_TLS === 'true',
      }

      return loadRedisConfig.from.row(cfg);
    },
    row: (cfg: RedisConfig) => {
      return redisConfigSchema.parse(cfg);
    },
  }
}