import { Logger } from "@nestjs/common";
import { RateCategory } from "../../domain";
import { RateLimitConfig } from "./rate.config";
import Redis from "ioredis";
import { RateLimitService } from "../../application";

export class TokenBucketRateLimitService implements RateLimitService {
  private readonly logger = new Logger(TokenBucketRateLimitService.name);

  constructor(private readonly redis: Redis, private readonly configs: Record<RateCategory, RateLimitConfig>) { }

  /**
   * Check if request is allowed under rate limit
   * Returns true if within limit, false if exceeded
   * @returns [isAllowed, currentCountAfterAdd] - count includes the request that was just added
   */
  async isAllowed(key: string, baseCategory: RateCategory = 'public'): Promise<boolean> {
    const category = baseCategory;

    const config = this.configs[category];
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const redisKey = this.getRedisKey(key, category);

    try {
      // Use ZSET for sliding window counter
      // Remove old entries outside the window (scores <= windowStart)
      // Use '-inf' to ensure we remove everything up to windowStart (inclusive)
      await this.redis.zremrangebyscore(redisKey, '-inf', windowStart);

      // Count requests in current window (scores > windowStart)
      // Use zcard since we just cleaned old entries - all remaining are in window
      const count = await this.redis.zcard(redisKey);

      if (count >= config.maxRequests) {
        this.logger.warn({ rateLimitKey: key, rateLimitCategory: category, requestCount: count }, 'Rate limit exceeded');
        return false;
      }

      // Add current request timestamp to the set
      // Use unique member to handle concurrent requests
      await this.redis.zadd(redisKey, now, `${now}-${Math.random()}`);

      // Set expiration on the key (window + 1s buffer)
      await this.redis.expire(redisKey, Math.ceil((config.windowMs + 1000) / 1000));

      return true;
    } catch (error) {
      this.logger.error({ rateLimitKey: key, err: error }, 'Rate limiter error');
      // Fail open - allow request if rate limiter fails
      return true;
    }
  }

  /**
   * Get current count in window (without adding request)
   * Used internally for accurate remaining calculation
   */
  private async getCurrentCount(key: string, category: RateCategory): Promise<number> {
    const config = this.configs[category];
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const redisKey = this.getRedisKey(key, category);

    try {
      // Clean old entries first
      await this.redis.zremrangebyscore(redisKey, '-inf', windowStart);
      // Count remaining (all are in window after cleanup)
      const count = await this.redis.zcard(redisKey);
      return count;
    } catch (error) {
      this.logger.error({ rateLimitKey: key, err: error }, 'Error getting current count');
      return 0;
    }
  }

  /**
   * Get remaining requests in current window
   * @param includeCurrentRequest - if true, assumes current request was already added via isAllowed
   */
  async getRemainingRequests(
    key: string,
    baseCategory: RateCategory = 'public',
    includeCurrentRequest: boolean = true
  ): Promise<number> {
    const category = baseCategory;
    const config = this.configs[category];

    try {
      // Get current count in window (with cleanup)
      const count = await this.getCurrentCount(key, category);
      
      // When includeCurrentRequest = true, isAllowed already added the current request,
      // so 'count' already includes it. Remaining = maxRequests - count.
      // When includeCurrentRequest = false, the current request hasn't been added yet,
      // so we need to account for it: remaining = maxRequests - (count + 1)
      const actualCount = includeCurrentRequest ? count : count + 1;
      const remaining = config.maxRequests - actualCount;
      return Math.max(0, remaining);
    } catch (error) {
      this.logger.error({ rateLimitKey: key, err: error }, 'Error getting remaining requests');
      return config.maxRequests; // Default to full quota if error
    }
  }

  /**
   * Get time until rate limit resets (in milliseconds)
   */
  async getResetTime(key: string, baseCategory: RateCategory = 'public'): Promise<number> {
    const category = baseCategory;
    const redisKey = this.getRedisKey(key, category);

    try {
      const ttl = await this.redis.pttl(redisKey);
      return ttl > 0 ? ttl : 0;
    } catch (error) {
      this.logger.error({ rateLimitKey: key, err: error }, 'Error getting reset time');
      return 0;
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(key: string, baseCategory: RateCategory = 'public'): Promise<void> {
    const category = baseCategory;
    const redisKey = this.getRedisKey(key, category);

    try {
      await this.redis.del(redisKey);
      this.logger.debug({ rateLimitKey: key, rateLimitCategory: category }, 'Rate limit reset');
    } catch (error) {
      this.logger.error({ rateLimitKey: key, err: error }, 'Error resetting rate limit');
    }
  }

  /**
   * Reset all rate limits for a prefix
   */
  async resetPrefix(prefix: string): Promise<void> {
    try {
      const pattern = `ratelimit:${prefix}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug({ resetCount: keys.length, rateLimitPrefix: prefix }, 'Rate limit keys reset');
      }
    } catch (error) {
      this.logger.error({ rateLimitPrefix: prefix, err: error }, 'Error resetting rate limit prefix');
    }
  }

  private getRedisKey(identifier: string, category: RateCategory): string {
    return `ratelimit:${category}:${identifier}`;
  }
}
