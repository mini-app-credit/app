import { describe, it, expect, beforeEach } from '@jest/globals';
import { TokenRepositoryImpl } from './token.repository';
import { Token } from '../../domain/entities/token.entity';
import { UUIDIdentifier } from 'src/shared';
import { TokenType } from '../../domain/value-objects/token-type.vo';

describe('TokenRepositoryImpl', () => {
  let tokenRepository: TokenRepositoryImpl;
  let mockRedis: any;
  let mockMulti: any;

  beforeEach(() => {
    mockMulti = {
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      pexpireat: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(0),
      mget: jest.fn(),
      zadd: jest.fn().mockResolvedValue(1),
      zrange: jest.fn(),
      zrem: jest.fn().mockResolvedValue(0),
      zremrangebyscore: jest.fn().mockResolvedValue(0),
      multi: jest.fn().mockReturnValue(mockMulti),
    };
    tokenRepository = new TokenRepositoryImpl(mockRedis as any);
  });

  describe('save', () => {
    it('should save tokens using Redis pipeline', async () => {
      const accountId: UUIDIdentifier = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' as any;
      const tokens = [
        Token.create({
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' as any,
          userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' as any,
          accountId,
          type: TokenType.access(),
          value: 'access-value' as any,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        }),
      ];

      mockMulti.exec.mockResolvedValue([true, true, true]);

      const result = await tokenRepository.save(tokens);

      expect(result).toHaveLength(1);
      expect(mockRedis.multi).toHaveBeenCalled();
      expect(mockMulti.exec).toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const accountId: UUIDIdentifier = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' as any;
      const tokens = [
        Token.create({
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' as any,
          userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' as any,
          accountId,
          type: TokenType.access(),
          value: 'value' as any,
          expiresAt: new Date(Date.now() + 900000),
        }),
      ];

      mockMulti.exec.mockRejectedValue(new Error('Redis error'));

      try {
        await tokenRepository.save(tokens);
        throw new Error('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Redis error');
      }
    });
  });

  describe('findByAccountId', () => {
    it('should retrieve tokens for an account', async () => {
      const accountId: UUIDIdentifier = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' as any;
      const tokenData = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        accountId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        type: 'access',
        value: 'value',
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.zremrangebyscore.mockResolvedValue(0);
      mockRedis.zrange.mockResolvedValue(['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11']);
      mockRedis.mget.mockResolvedValue([JSON.stringify(tokenData)]);

      const tokens = await tokenRepository.findByAccountId(accountId);

      expect(tokens).toHaveLength(1);
      expect(tokens[0].id.toString()).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    });

    it('should return empty array when account has no tokens', async () => {
      const accountId: UUIDIdentifier = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' as any;

      mockRedis.zremrangebyscore.mockResolvedValue(0);
      mockRedis.zrange.mockResolvedValue([]);

      const tokens = await tokenRepository.findByAccountId(accountId);

      expect(tokens).toHaveLength(0);
    });
  });

  describe('findByAccountIdAndId', () => {
    it('should find a specific token', async () => {
      const accountId: UUIDIdentifier = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' as any;
      const tokenData = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        accountId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        type: 'refresh',
        value: 'refresh-value',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(tokenData));

      const token = await tokenRepository.findByAccountIdAndId(accountId, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

      expect(token).toBeDefined();
      expect(token?.id.toString()).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    });

    it('should return null when token not found', async () => {
      const accountId: UUIDIdentifier = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' as any;

      mockRedis.get.mockResolvedValue(null);

      const token = await tokenRepository.findByAccountIdAndId(accountId, 'nonexistent');

      expect(token).toBeNull();
    });
  });

  describe('deleteByAccountId', () => {
    it('should delete all account tokens using pipeline', async () => {
      const accountId: UUIDIdentifier = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' as any;

      mockRedis.zrange.mockResolvedValue(['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12']);
      mockMulti.exec.mockResolvedValue([1, 1, 1]);

      await tokenRepository.deleteByAccountId(accountId);

      expect(mockRedis.zrange).toHaveBeenCalled();
      expect(mockRedis.multi).toHaveBeenCalled();
      expect(mockMulti.del).toHaveBeenCalled();
    });

    it('should handle empty account gracefully', async () => {
      const accountId: UUIDIdentifier = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' as any;

      mockRedis.zrange.mockResolvedValue([]);

      await expect(tokenRepository.deleteByAccountId(accountId)).resolves.toBeUndefined();
      expect(mockRedis.del).toHaveBeenCalled();
    });
  });
});
