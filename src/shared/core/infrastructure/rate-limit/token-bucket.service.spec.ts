import { describe, it, expect, beforeEach } from '@jest/globals';
import { TokenBucketRateLimitService } from './token-bucket.service';
import { configs } from './rate.config';

describe('TokenBucketRateLimitService', () => {
  let service: TokenBucketRateLimitService;
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      zremrangebyscore: jest.fn().mockResolvedValue(0),
      zcard: jest.fn().mockResolvedValue(0),
      zadd: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      zcount: jest.fn().mockResolvedValue(0),
      pttl: jest.fn().mockResolvedValue(60000),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
    };

    service = new TokenBucketRateLimitService(mockRedis, configs);
  });

  describe('isAllowed', () => {
    it('should allow request when within limit', async () => {
      mockRedis.zcard.mockResolvedValue(5);
      const result = await service.isAllowed('test-key', 'public');
      expect(result).toBe(true);
      expect(mockRedis.zcard).toHaveBeenCalled();
      expect(mockRedis.zadd).toHaveBeenCalled();
    });

    it('should deny request when exceeding limit', async () => {
      mockRedis.zcard.mockResolvedValue(100);
      const result = await service.isAllowed('test-key', 'public');
      expect(result).toBe(false);
    });

    it('should handle auth-sensitive category (10 requests)', async () => {
      mockRedis.zcard.mockResolvedValue(10);
      const result = await service.isAllowed('test-key', 'auth-sensitive');
      expect(result).toBe(false);
    });

    it('should handle authenticated category (300 requests)', async () => {
      mockRedis.zcard.mockResolvedValue(299);
      const result = await service.isAllowed('test-key', 'authenticated');
      expect(result).toBe(true);
    });

    it('should clean old entries from window', async () => {
      await service.isAllowed('test-key', 'public');
      expect(mockRedis.zremrangebyscore).toHaveBeenCalled();
    });

    it('should set TTL on Redis key', async () => {
      await service.isAllowed('test-key', 'public');
      expect(mockRedis.expire).toHaveBeenCalled();
    });

    it('should fail open on Redis error', async () => {
      mockRedis.zcard.mockRejectedValue(new Error('Redis error'));
      const result = await service.isAllowed('test-key', 'public');
      expect(result).toBe(true);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return correct remaining requests', async () => {
      mockRedis.zcount.mockResolvedValue(30);
      const remaining = await service.getRemainingRequests('test-key', 'public');
      expect(remaining).toBe(70);
    });

    it('should return 0 when at limit', async () => {
      mockRedis.zcount.mockResolvedValue(100);
      const remaining = await service.getRemainingRequests('test-key', 'public');
      expect(remaining).toBe(0);
    });

    it('should return full quota on error', async () => {
      mockRedis.zcount.mockRejectedValue(new Error('Redis error'));
      const remaining = await service.getRemainingRequests('test-key', 'public');
      expect(remaining).toBe(100);
    });

    it('should work with different categories', async () => {
      mockRedis.zcount.mockResolvedValue(5);
      const authRemaining = await service.getRemainingRequests('user:123', 'authenticated');
      expect(authRemaining).toBe(295);
    });
  });

  describe('getResetTime', () => {
    it('should return remaining TTL in milliseconds', async () => {
      mockRedis.pttl.mockResolvedValue(45000);
      const resetTime = await service.getResetTime('test-key', 'public');
      expect(resetTime).toBe(45000);
    });

    it('should return 0 when key does not exist', async () => {
      mockRedis.pttl.mockResolvedValue(-2);
      const resetTime = await service.getResetTime('test-key', 'public');
      expect(resetTime).toBe(0);
    });

    it('should return 0 on error', async () => {
      mockRedis.pttl.mockRejectedValue(new Error('Redis error'));
      const resetTime = await service.getResetTime('test-key', 'public');
      expect(resetTime).toBe(0);
    });
  });

  describe('reset', () => {
    it('should delete rate limit key', async () => {
      await service.reset('test-key', 'public');
      expect(mockRedis.del).toHaveBeenCalledWith(expect.stringContaining('ratelimit:'));
    });

    it('should handle different categories', async () => {
      await service.reset('user:123', 'authenticated');
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));
      expect(async () => {
        await service.reset('test-key', 'public');
      }).not.toThrow();
    });
  });

  describe('resetPrefix', () => {
    it('should delete all keys matching prefix', async () => {
      const mockKeys = ['ratelimit:user:123', 'ratelimit:user:456'];
      mockRedis.keys.mockResolvedValue(mockKeys);

      await service.resetPrefix('user:');

      expect(mockRedis.keys).toHaveBeenCalledWith('ratelimit:user::*');
      expect(mockRedis.del).toHaveBeenCalledWith(...mockKeys);
    });

    it('should handle empty prefix', async () => {
      mockRedis.keys.mockResolvedValue([]);
      await service.resetPrefix('nonexistent:');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));
      expect(async () => {
        await service.resetPrefix('user:');
      }).not.toThrow();
    });
  });

  describe('Redis key generation', () => {
    it('should generate correct key format', async () => {
      await service.isAllowed('test-key', 'public');
      const calls = mockRedis.zadd.mock.calls;
      expect(calls[0][0]).toMatch(/^ratelimit:public:/);
    });

    it('should include category in key', async () => {
      await service.isAllowed('email@test.com', 'auth-sensitive');
      const calls = mockRedis.zadd.mock.calls;
      expect(calls[0][0]).toMatch(/^ratelimit:auth-sensitive:/);
    });
  });

  describe('default category', () => {
    it('should default to public category', async () => {
      await service.isAllowed('test-key');
      const calls = mockRedis.zadd.mock.calls;
      expect(calls[0][0]).toMatch(/^ratelimit:public:/);
    });
  });
});
