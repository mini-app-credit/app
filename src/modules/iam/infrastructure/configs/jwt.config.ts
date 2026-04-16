import { z } from 'zod';
import type { Algorithm } from 'jsonwebtoken';

const algorithmSchema = z.enum([
  'HS256', 'HS384', 'HS512',
  'RS256', 'RS384', 'RS512',
  'ES256', 'ES384', 'ES512',
  'PS256', 'PS384', 'PS512',
  'none',
]);

const expiresInSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+(ms|s|m|h|d|w|y)?$/),
]);

export const jwtConfigSchema = z.object({
  jwtSecret: z.string().min(1),
  jwtExpiresIn: expiresInSchema,
  jwtAlgorithm: algorithmSchema,
});

export const jwtEnvConfigSchema = z.object({
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: expiresInSchema,
});

export type JwtConfig = {
  jwtSecret: string;
  jwtExpiresIn: number | `${number}${string}`;
  jwtAlgorithm: Algorithm;
};
export type JwtEnvConfig = z.infer<typeof jwtEnvConfigSchema>;

export const loadJwtConfig = {
  from: {
    env: (env: NodeJS.ProcessEnv) => {
      const cfg = jwtEnvConfigSchema.parse(env);
      return loadJwtConfig.from.row({
        jwtSecret: cfg.JWT_SECRET,
        jwtExpiresIn: cfg.JWT_EXPIRES_IN as number | `${number}${string}`,
        jwtAlgorithm: 'HS256',
      });
    },
    row: (row: JwtConfig) => {
      const parsed = jwtConfigSchema.parse(row);
      return {
        jwtSecret: parsed.jwtSecret,
        jwtExpiresIn: parsed.jwtExpiresIn as number | `${number}${string}`,
        jwtAlgorithm: parsed.jwtAlgorithm as Algorithm,
      } satisfies JwtConfig;
    },
  },
};
