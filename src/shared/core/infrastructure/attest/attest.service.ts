import { Redis } from "ioredis";
import { AttestService } from "../../application";
import { AttestCreateProps } from "../../application/services/attest.service";
import { Attest } from "../../domain";
import { v4 as uuid } from "uuid";

/**
 * Options for the AttestService
 * @param baseTable - The base table name for the attest
 * @param ttl - The time to live for the attest in seconds
 */
export interface AttestServiceOptions {
  baseTable: string;
  ttl: number;
}

export class AttestServiceImpl implements AttestService {
  constructor(private readonly redis: Redis, private readonly options: AttestServiceOptions) { }

  private key(token: string): string {
    return `${this.options.baseTable}:${token}`;
  }

  async issue(data: AttestCreateProps): Promise<Attest> {
    const token = uuid()

    const newAttest = Attest.create({
      expiresAt: data.expiresAt,
      payload: data.payload,
      value: token,
    })

    const key = this.key(token);

    await this.redis.set(key, JSON.stringify(newAttest.toObject()), 'EX', this.options.ttl);

    return newAttest;
  }
  async verify(token: string): Promise<Attest | null> {
    const key = this.key(token);

    const attestRaw = await this.redis.get(key);

    if (!attestRaw) return null;

    const attest = Attest.restore(JSON.parse(attestRaw));

    if (attest.isExpired()) return null;

    return attest;
  }
  async revoke(token: string): Promise<void> {
    const key = this.key(token);

    await this.redis.del(key);
  }
}