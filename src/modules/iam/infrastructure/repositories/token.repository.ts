import Redis from "ioredis";
import { Token, TokenRepository } from "../../domain";
import { UUIDIdentifier } from "src/shared";
import { TokenMapper } from "../../application/mappers";
import { TokenDto } from "../../application/dtos/token";

export class TokenRepositoryImpl implements TokenRepository {
  constructor(private readonly redis: Redis) { }

  private readonly tokenKeyMask = "accounts:{accountId}:tokens:{tokenId}";
  private readonly indexKeyMask = "accounts:{accountId}:tokens_idx";

  private tokenKey(accountId: UUIDIdentifier, tokenId: string): string {
    return this.tokenKeyMask
      .replace("{accountId}", accountId.toString())
      .replace("{tokenId}", tokenId);
  }

  private indexKey(accountId: UUIDIdentifier): string {
    return this.indexKeyMask.replace("{accountId}", accountId.toString());
  }

  async findByAccountId(accountId: UUIDIdentifier): Promise<Token[]> {
    const idx = this.indexKey(accountId);
    const now = Date.now();
    await this.redis.zremrangebyscore(idx, "-inf", now);
    const tokenIds = await this.redis.zrange(idx, 0, -1);
    if (tokenIds.length === 0) return [];

    const keys = tokenIds.map((id) => this.tokenKey(accountId, id));
    const rawList = await this.redis.mget(keys);

    const missing: string[] = [];
    const tokens: Token[] = [];

    for (let i = 0; i < tokenIds.length; i++) {
      const raw = rawList[i];
      if (raw == null) {
        missing.push(tokenIds[i]);
        continue;
      }
      const parsed = JSON.parse(raw) as TokenDto;
      tokens.push(TokenMapper.toDomain(parsed));
    }

    if (missing.length > 0) {
      await this.redis.zrem(idx, ...missing);
    }

    return tokens;
  }

  async findByAccountIdAndId(accountId: UUIDIdentifier, tokenId: string): Promise<Token | null> {
    const key = this.tokenKey(accountId, tokenId);
    const raw = await this.redis.get(key);

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as TokenDto;
      return TokenMapper.toDomain(parsed);
    } catch {
      return null;
    }
  }

  async save(tokens: Token[]): Promise<Token[]> {
    if (tokens.length === 0) return [];

    const multi = this.redis.multi();

    for (const token of tokens) {
      const dto = TokenMapper.toDto(token);
      const json = JSON.stringify(dto);
      const key = this.tokenKey(token.accountId, dto.id);
      const idx = this.indexKey(token.accountId);
      const expiresAtMs = new Date(dto.expiresAt).getTime();

      multi.set(key, json);
      if (Number.isFinite(expiresAtMs) && expiresAtMs > Date.now()) {
        multi.pexpireat(key, expiresAtMs);
      }
      if (Number.isFinite(expiresAtMs)) {
        multi.zadd(idx, expiresAtMs, dto.id);
      } else {
        multi.zadd(idx, Date.now(), dto.id);
      }
    }

    await multi.exec();
    return tokens;
  }

  async deleteByAccountId(accountId: UUIDIdentifier): Promise<void> {
    const idx = this.indexKey(accountId);
    // Get all token IDs from the index BEFORE deleting it
    const tokenIds = await this.redis.zrange(idx, 0, -1);

    if (tokenIds.length > 0) {
      const multi = this.redis.multi();
      // Delete each token key
      for (const tokenId of tokenIds) {
        const key = this.tokenKey(accountId, tokenId);
        multi.del(key);
      }
      // Delete the index after all tokens are deleted
      multi.del(idx);
      await multi.exec();
    } else {
      // If no tokens, just delete the index
      await this.redis.del(idx);
    }
  }

  async deleteByAccountIdAndId(accountId: UUIDIdentifier, tokenId: string): Promise<void> {
    const key = this.tokenKey(accountId, tokenId);
    const idx = this.indexKey(accountId);
    
    const multi = this.redis.multi();
    multi.del(key);
    multi.zrem(idx, tokenId);
    
    await multi.exec();
  }
}
