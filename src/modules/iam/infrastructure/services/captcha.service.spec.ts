import { describe, it, expect, beforeEach } from '@jest/globals';
import { GoogleCaptchaService } from './captcha.service';
import axios from 'axios';

jest.mock('axios');

describe('GoogleCaptchaService', () => {
  let captchaService: GoogleCaptchaService;
  let mockPost: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPost = jest.fn();
    (axios.create as any) = jest.fn(() => ({
      post: mockPost,
    }));
  });

  describe('constructor and createClient', () => {
    it('should create service with valid options', () => {
      const service = new GoogleCaptchaService({
        secret: 'test-secret-key',
        timeoutMs: 5000,
      });
      expect(service).toBeDefined();
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://www.google.com/recaptcha/api/siteverify',
        timeout: 5000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    });
  });

  describe('verify', () => {
    beforeEach(() => {
      captchaService = new GoogleCaptchaService({
        secret: 'test-secret-key',
        timeoutMs: 5000,
      });
    });

    it('should return null for empty token', async () => {
      const result = await captchaService.verify('');
      expect(result).toBeNull();
    });

    it('should return null when verify request fails', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));
      const result = await captchaService.verify('valid-token', '192.168.1.1');
      expect(result).toBeNull();
    });

    it('should return null for invalid response schema', async () => {
      mockPost.mockResolvedValue({
        data: { invalid: 'response' }, // missing 'success' field
      });
      const result = await captchaService.verify('valid-token');
      expect(result).toBeNull();
    });

    it('should return parsed response on success', async () => {
      const mockResponse = {
        success: true,
        score: 0.9,
        action: 'signup',
        challenge_ts: new Date().toISOString(),
        hostname: 'example.com',
      };
      mockPost.mockResolvedValue({ data: mockResponse });

      const result = await captchaService.verify('valid-token', '192.168.1.1');

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('', expect.any(URLSearchParams));
    });

    it('should include IP in request body when provided', async () => {
      mockPost.mockResolvedValue({
        data: { success: true },
      });

      await captchaService.verify('token', '192.168.1.1');

      const callArgs = mockPost.mock.calls[0][1];
      expect(callArgs.get('remoteip')).toBe('192.168.1.1');
      expect(callArgs.get('secret')).toBe('test-secret-key');
    });
  });

  describe('isValid', () => {
    beforeEach(() => {
      captchaService = new GoogleCaptchaService({
        secret: 'test-secret-key',
        timeoutMs: 5000,
      });
    });

    it('should return false when verify returns null', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));
      const result = await captchaService.isValid('invalid-token');
      expect(result).toBe(false);
    });

    it('should return false when success is false', async () => {
      mockPost.mockResolvedValue({
        data: { success: false },
      });
      const result = await captchaService.isValid('invalid-token');
      expect(result).toBe(false);
    });

    it('should return true for valid token with default options', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          score: 0.9, // >= default 0.5
        },
      });
      const result = await captchaService.isValid('valid-token');
      expect(result).toBe(true);
    });

    it('should return false when score is below minScore threshold', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          score: 0.3, // < minScore 0.7
        },
      });
      const result = await captchaService.isValid('low-score-token', undefined, {
        minScore: 0.7,
      });
      expect(result).toBe(false);
    });

    it('should return true when score meets minScore threshold', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          score: 0.7, // >= minScore 0.7
        },
      });
      const result = await captchaService.isValid('good-token', undefined, {
        minScore: 0.7,
      });
      expect(result).toBe(true);
    });

    it('should return false when action does not match expectedAction', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          score: 0.9,
          action: 'login',
        },
      });
      const result = await captchaService.isValid('token', undefined, {
        expectedAction: 'signup',
      });
      expect(result).toBe(false);
    });

    it('should return true when action matches expectedAction', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          score: 0.9,
          action: 'signup',
        },
      });
      const result = await captchaService.isValid('token', undefined, {
        expectedAction: 'signup',
      });
      expect(result).toBe(true);
    });

    it('should validate multiple conditions together', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          score: 0.8,
          action: 'signup',
        },
      });
      const result = await captchaService.isValid('token', '192.168.1.1', {
        minScore: 0.7,
        expectedAction: 'signup',
      });
      expect(result).toBe(true);
    });

    it('should return false when one of multiple conditions fails', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          score: 0.4, // fails minScore check
          action: 'signup', // passes action check
        },
      });
      const result = await captchaService.isValid('token', undefined, {
        minScore: 0.7,
        expectedAction: 'signup',
      });
      expect(result).toBe(false);
    });

    it('should handle response without score field', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          // no score field
        },
      });
      const result = await captchaService.isValid('token');
      expect(result).toBe(true); // score check skipped if undefined
    });

    it('should handle response with error codes', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: false,
          'error-codes': ['missing-input-secret', 'missing-input-response'],
        },
      });
      const result = await captchaService.isValid('token');
      expect(result).toBe(false);
    });
  });

  describe('edge cases and validation', () => {
    beforeEach(() => {
      captchaService = new GoogleCaptchaService({
        secret: 'test-secret-key',
        timeoutMs: 5000,
      });
    });

    it('should handle minScore boundary values (0 and 1)', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          score: 0.5,
        },
      });

      const result0 = await captchaService.isValid('token', undefined, {
        minScore: 0,
      });
      expect(result0).toBe(true);

      const result1 = await captchaService.isValid('token', undefined, {
        minScore: 1,
      });
      expect(result1).toBe(false);
    });

    it('should handle timeout scenarios gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AxiosError';
      mockPost.mockRejectedValue(timeoutError);

      const result = await captchaService.isValid('token');
      expect(result).toBe(false);
    });

    it('should extract secret and timeout from options', () => {
      const opts = { secret: 'my-secret', timeoutMs: 10000 };
      const service = new GoogleCaptchaService(opts);
      // Service should be created successfully with given options
      expect(service).toBeDefined();
    });
  });
});
