import {
  Algorithm,
  JwtPayload as JwtLibPayload,
  Secret,
  SignOptions,
} from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { JwtOptions, JwtService, JwtPayload } from '../../application/services';

const tokenSchema = z.string().min(1);
const expiresInSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+(ms|s|m|h|d|w|y)?$/),
]);
const payloadSchema = z.record(z.unknown());
const generateOptsSchema = z.object({
  expiresIn: expiresInSchema,
  secret: z.string().min(1).optional(),
}).strict();
const validateOptsSchema = z.object({
  expiresIn: expiresInSchema.optional(),
  secret: z.string().min(1).optional(),
}).strict();

export interface JsonWebTokenServiceOptions {
  secret: string;
  defaultExpiresIn: number | `${number}${string}`;
  algorithm: Algorithm;
}

export class JsonWebTokenService implements JwtService {
  private readonly defaultSecret?: string;
  private readonly defaultExpiresIn: number | `${number}${string}`;
  private readonly algorithm: Algorithm;

  constructor(opts?: JsonWebTokenServiceOptions) {
    this.defaultSecret = opts?.secret ?? process.env.JWT_SECRET;
    this.defaultExpiresIn = opts?.defaultExpiresIn ?? '15m';
    this.algorithm = opts?.algorithm ?? 'HS256';
  }

  async generate(payload: JwtPayload, options?: JwtOptions): Promise<string> {
    payloadSchema.parse(payload);

    const parsed = generateOptsSchema.parse({
      expiresIn: options?.expiresIn ?? this.defaultExpiresIn,
      secret: options?.secret ?? this.defaultSecret,
    });

    const resolvedSecret = parsed.secret;
    if (!resolvedSecret) throw new Error('JWT secret is required');

    const signOptions: SignOptions = {
      algorithm: this.algorithm,
      expiresIn: parsed.expiresIn as number,
    };

    return jwt.sign(payload as object, resolvedSecret as Secret, signOptions);
  }

  async validate(token: string, options?: JwtOptions): Promise<JwtPayload | null> {
    const t = tokenSchema.safeParse(token);
    if (!t.success) return null;

    const parsed = validateOptsSchema.parse({
      secret: options?.secret ?? this.defaultSecret,
      expiresIn: options?.expiresIn,
    });

    const resolvedSecret = parsed.secret;
    if (!resolvedSecret) return null;

    try {
      const decoded = jwt.verify(t.data, resolvedSecret as Secret, {
        algorithms: [this.algorithm],
      }) as JwtLibPayload | string;

      return typeof decoded === 'object' && decoded !== null ? (decoded as JwtPayload) : null;
    } catch {
      return null;
    }
  }
}
