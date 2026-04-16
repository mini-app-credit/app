import { describe, it, expect, beforeEach } from '@jest/globals';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService (Interface)', () => {
  let mockService: RateLimitService;

  beforeEach(() => {
    mockService = {
      isAllowed: jest.fn(),
      getRemainingRequests: jest.fn(),
      getResetTime: jest.fn(),
      reset: jest.fn(),
      resetPrefix: jest.fn(),
    };
  });

  describe('isAllowed', () => {
    it('should return true when within limit', async () => {
      (mockService.isAllowed as jest.Mock).mockResolvedValue(true);
      const result = await mockService.isAllowed('test-key', 'public');
      expect(result).toBe(true);
    });

    it('should return false when exceeding limit', async () => {
      (mockService.isAllowed as jest.Mock).mockResolvedValue(false);
      const result = await mockService.isAllowed('test-key', 'auth-sensitive');
      expect(result).toBe(false);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return remaining requests count', async () => {
      (mockService.getRemainingRequests as jest.Mock).mockResolvedValue(50);
      const result = await mockService.getRemainingRequests('test-key', 'public');
      expect(result).toBe(50);
    });

    it('should return 0 when all requests consumed', async () => {
      (mockService.getRemainingRequests as jest.Mock).mockResolvedValue(0);
      const result = await mockService.getRemainingRequests('test-key', 'authenticated');
      expect(result).toBe(0);
    });
  });

  describe('getResetTime', () => {
    it('should return reset time in milliseconds', async () => {
      (mockService.getResetTime as jest.Mock).mockResolvedValue(30000);
      const result = await mockService.getResetTime('test-key', 'public');
      expect(result).toBe(30000);
    });

    it('should return 0 when not rate limited', async () => {
      (mockService.getResetTime as jest.Mock).mockResolvedValue(0);
      const result = await mockService.getResetTime('test-key', 'auth-sensitive');
      expect(result).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset rate limit for key', async () => {
      (mockService.reset as jest.Mock).mockResolvedValue(undefined);
      await mockService.reset('test-key', 'public');
      expect(mockService.reset).toHaveBeenCalledWith('test-key', 'public');
    });
  });

  describe('resetPrefix', () => {
    it('should reset all rate limits for prefix', async () => {
      (mockService.resetPrefix as jest.Mock).mockResolvedValue(undefined);
      await mockService.resetPrefix('user:');
      expect(mockService.resetPrefix).toHaveBeenCalledWith('user:');
    });
  });
});
