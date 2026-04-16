import { describe, it, expect, beforeEach } from '@jest/globals';
import { RateLimitGuard, RateLimit } from './rate-limit.guard';
import { RATE_LIMIT_CATEGORY } from '../../domain';
import { HttpException, HttpStatus } from '@nestjs/common';
import { configs } from '../../infrastructure';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let mockRateLimitService: any;
  let mockReflector: any;
  let mockContext: any;

  beforeEach(() => {
    mockRateLimitService = {
      isAllowed: jest.fn(),
      getRemainingRequests: jest.fn(),
      getResetTime: jest.fn(),
      reset: jest.fn(),
      resetPrefix: jest.fn(),
    };

    mockReflector = {
      get: jest.fn(),
    };

    mockContext = {
      switchToHttp: jest.fn(),
      getHandler: jest.fn(),
    };

    guard = new RateLimitGuard(mockReflector, mockRateLimitService, configs);
  });

  describe('canActivate', () => {
    it('should return true when no decorator metadata', async () => {
      const mockRequest: any = { headers: {}, body: {} };
      const mockResponse = { set: jest.fn() };

      mockReflector.get.mockReturnValue(null);
      mockContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow request when within rate limit', async () => {
      const mockRequest: any = { headers: {}, body: {}, user: {} };
      const mockResponse = { set: jest.fn() };

      mockReflector.get.mockReturnValue({
        category: RATE_LIMIT_CATEGORY.PUBLIC,
      });
      mockContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      });
      mockContext.getHandler.mockReturnValue(jest.fn());

      mockRateLimitService.isAllowed.mockResolvedValue(true);
      mockRateLimitService.getRemainingRequests.mockResolvedValue(50);
      mockRateLimitService.getResetTime.mockResolvedValue(0);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockRequest.rateLimitInfo).toBeDefined();
    });

    it('should throw 429 when exceeding rate limit', async () => {
      const mockRequest = { headers: {}, body: {} };
      const mockResponse = { set: jest.fn() };

      mockReflector.get.mockReturnValue({
        category: RATE_LIMIT_CATEGORY.PUBLIC,
      });
      mockContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      });
      mockContext.getHandler.mockReturnValue(jest.fn());

      mockRateLimitService.isAllowed.mockResolvedValue(false);
      mockRateLimitService.getResetTime.mockResolvedValue(30000);
      mockRateLimitService.getRemainingRequests.mockResolvedValue(0);

      try {
        await guard.canActivate(mockContext);
        throw new Error('Should have thrown HttpException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('should set rate limit response headers on exceed', async () => {
      const mockRequest = { headers: {}, body: {} };
      const mockResponse = { set: jest.fn() };

      mockReflector.get.mockReturnValue({
        category: RATE_LIMIT_CATEGORY.PUBLIC,
      });
      mockContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      });
      mockContext.getHandler.mockReturnValue(jest.fn());

      mockRateLimitService.isAllowed.mockResolvedValue(false);
      mockRateLimitService.getResetTime.mockResolvedValue(45000);
      mockRateLimitService.getRemainingRequests.mockResolvedValue(0);

      try {
        await guard.canActivate(mockContext);
      } catch (e) {
        console.warn('Can Activate Error', e);
        // Expected
      }

      expect(mockResponse.set).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(mockResponse.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
    });
  });

  describe('rate limit categories', () => {
    it('should rate limit by IP for PUBLIC', async () => {
      const mockRequest: any = {
        headers: { 'x-forwarded-for': '192.168.1.1' },
        body: {},
      };
      const mockResponse = { set: jest.fn() };

      mockReflector.get.mockReturnValue({
        category: RATE_LIMIT_CATEGORY.PUBLIC,
      });
      mockContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      });
      mockContext.getHandler.mockReturnValue(jest.fn());

      mockRateLimitService.isAllowed.mockResolvedValue(true);
      mockRateLimitService.getRemainingRequests.mockResolvedValue(100);
      mockRateLimitService.getResetTime.mockResolvedValue(0);

      await guard.canActivate(mockContext);

      expect(mockRateLimitService.isAllowed).toHaveBeenCalledWith(
        'public:192.168.1.1',
        RATE_LIMIT_CATEGORY.PUBLIC
      );
    });

    it('should rate limit by IP+email for AUTH_SENSITIVE with execute function', async () => {
      const mockRequest: any = {
        headers: { 'x-forwarded-for': '192.168.1.1' },
        body: { email: 'test@example.com' },
      };
      const mockResponse = { set: jest.fn() };

      mockReflector.get.mockReturnValue({
        category: RATE_LIMIT_CATEGORY.AUTH_SENSITIVE,
        execute: (request: any) => request.body.email,
      });
      mockContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      });
      mockContext.getHandler.mockReturnValue(jest.fn());

      mockRateLimitService.isAllowed.mockResolvedValue(true);
      mockRateLimitService.getRemainingRequests.mockResolvedValue(10);
      mockRateLimitService.getResetTime.mockResolvedValue(0);

      await guard.canActivate(mockContext);

      expect(mockRateLimitService.isAllowed).toHaveBeenCalledWith(
        'auth-sensitive:192.168.1.1:test@example.com',
        RATE_LIMIT_CATEGORY.AUTH_SENSITIVE
      );
    });

    it('should rate limit by user_id for AUTHENTICATED', async () => {
      const mockRequest: any = {
        headers: {},
        body: {},
        user: { userId: '123', accountId: '456' },
      };
      const mockResponse = { set: jest.fn() };

      mockReflector.get.mockReturnValue({
        category: RATE_LIMIT_CATEGORY.AUTHENTICATED,
      });
      mockContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      });
      mockContext.getHandler.mockReturnValue(jest.fn());

      mockRateLimitService.isAllowed.mockResolvedValue(true);
      mockRateLimitService.getRemainingRequests.mockResolvedValue(300);
      mockRateLimitService.getResetTime.mockResolvedValue(0);

      await guard.canActivate(mockContext);

      expect(mockRateLimitService.isAllowed).toHaveBeenCalledWith(
        'authenticated:123',
        RATE_LIMIT_CATEGORY.AUTHENTICATED
      );
    });

    it('should return null key when AUTH_SENSITIVE without execute function result', async () => {
      const mockRequest: any = {
        headers: { 'x-forwarded-for': '192.168.1.1' },
        body: {},
      };
      const mockResponse = { set: jest.fn() };

      mockReflector.get.mockReturnValue({
        category: RATE_LIMIT_CATEGORY.AUTH_SENSITIVE,
        execute: (request: any) => request.body.email,
      });
      mockContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      });
      mockContext.getHandler.mockReturnValue(jest.fn());

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockRateLimitService.isAllowed).not.toHaveBeenCalled();
    });

    it('should return null key when AUTHENTICATED without user', async () => {
      const mockRequest: any = {
        headers: {},
        body: {},
        user: {},
      };
      const mockResponse = { set: jest.fn() };

      mockReflector.get.mockReturnValue({
        category: RATE_LIMIT_CATEGORY.AUTHENTICATED,
      });
      mockContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      });
      mockContext.getHandler.mockReturnValue(jest.fn());

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockRateLimitService.isAllowed).not.toHaveBeenCalled();
    });
  });

  describe('IP extraction', () => {
    it('should extract from X-Forwarded-For header', async () => {
      const mockRequest: any = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        body: {},
      };
      const mockResponse = { set: jest.fn() };

      mockReflector.get.mockReturnValue({
        category: RATE_LIMIT_CATEGORY.PUBLIC,
      });
      mockContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      });
      mockContext.getHandler.mockReturnValue(jest.fn());

      mockRateLimitService.isAllowed.mockResolvedValue(true);
      mockRateLimitService.getRemainingRequests.mockResolvedValue(100);
      mockRateLimitService.getResetTime.mockResolvedValue(0);

      await guard.canActivate(mockContext);

      expect(mockRateLimitService.isAllowed).toHaveBeenCalledWith(
        'public:192.168.1.1',
        RATE_LIMIT_CATEGORY.PUBLIC
      );
    });

    it('should fall back to X-Real-IP', async () => {
      const mockRequest: any = {
        headers: { 'x-real-ip': '10.0.0.1' },
        body: {},
      };
      const mockResponse = { set: jest.fn() };

      mockReflector.get.mockReturnValue({
        category: RATE_LIMIT_CATEGORY.PUBLIC,
      });
      mockContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      });
      mockContext.getHandler.mockReturnValue(jest.fn());

      mockRateLimitService.isAllowed.mockResolvedValue(true);
      mockRateLimitService.getRemainingRequests.mockResolvedValue(100);
      mockRateLimitService.getResetTime.mockResolvedValue(0);

      await guard.canActivate(mockContext);

      expect(mockRateLimitService.isAllowed).toHaveBeenCalledWith(
        'public:10.0.0.1',
        RATE_LIMIT_CATEGORY.PUBLIC
      );
    });
  });

  describe('RateLimit decorator', () => {
    it('should set metadata on method for PUBLIC', () => {
      const descriptor = { value: jest.fn() };
      const decorator = RateLimit({ category: RATE_LIMIT_CATEGORY.PUBLIC });
      const result = decorator({}, 'test', descriptor);

      expect(result).toBe(descriptor);
      const metadata = Reflect.getMetadata('rate-limit:options', descriptor.value);
      expect(metadata).toEqual({ category: RATE_LIMIT_CATEGORY.PUBLIC });
    });

    it('should set metadata on method for AUTH_SENSITIVE with execute', () => {
      const descriptor = { value: jest.fn() };
      const decorator = RateLimit({
        category: RATE_LIMIT_CATEGORY.AUTH_SENSITIVE,
        execute: (request: any) => request.body.email,
      });
      const result = decorator({}, 'test', descriptor);

      expect(result).toBe(descriptor);
      const metadata = Reflect.getMetadata('rate-limit:options', descriptor.value);
      expect(metadata.category).toBe(RATE_LIMIT_CATEGORY.AUTH_SENSITIVE);
      expect(metadata.execute).toBeDefined();
    });
  });
});
