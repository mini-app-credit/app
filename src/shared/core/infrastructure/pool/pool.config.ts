import { z } from 'zod';

export interface PoolConfig {
  maxSize: number;
  idleTimeoutMs: number;
  cleanupIntervalMs: number;
}

export const DEFAULT_POOL_CONFIG: PoolConfig = {
  maxSize: 1000,
  idleTimeoutMs: 30 * 60 * 1000, // 30 minutes
  cleanupIntervalMs: 60 * 1000, // 1 minute
};

const poolConfigSchema = z.object({
  maxSize: z.coerce.number().int().positive().optional(),
  idleTimeoutMs: z.coerce.number().int().positive().optional(),
  cleanupIntervalMs: z.coerce.number().int().positive().optional(),
});

export const loadPoolConfig = {
  from: {
    env: (env: NodeJS.ProcessEnv, prefix: string): PoolConfig => {
      const raw = {
        maxSize: env[`${prefix}_MAX_SIZE`],
        idleTimeoutMs: env[`${prefix}_IDLE_TIMEOUT_MS`],
        cleanupIntervalMs: env[`${prefix}_CLEANUP_INTERVAL_MS`],
      };
      const parsed = poolConfigSchema.parse(raw);
      return {
        maxSize: parsed.maxSize ?? DEFAULT_POOL_CONFIG.maxSize,
        idleTimeoutMs: parsed.idleTimeoutMs ?? DEFAULT_POOL_CONFIG.idleTimeoutMs,
        cleanupIntervalMs: parsed.cleanupIntervalMs ?? DEFAULT_POOL_CONFIG.cleanupIntervalMs,
      };
    },
    partial: (config: Partial<PoolConfig>): PoolConfig => ({
      maxSize: config.maxSize ?? DEFAULT_POOL_CONFIG.maxSize,
      idleTimeoutMs: config.idleTimeoutMs ?? DEFAULT_POOL_CONFIG.idleTimeoutMs,
      cleanupIntervalMs: config.cleanupIntervalMs ?? DEFAULT_POOL_CONFIG.cleanupIntervalMs,
    }),
  },
};
