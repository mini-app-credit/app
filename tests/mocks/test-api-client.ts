import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiAppModule } from '../../apps/api/src/app/api-app.module';
import * as request from 'supertest';
import { ApiClient, ApiResponse } from './api-client';

/**
 * Test Application Factory
 * Creates NestJS application for testing with supertest
 */
export class TestApplicationFactory {
  private app: INestApplication | null = null;
  private module: TestingModule | null = null;

  /**
   * Create and initialize test application
   */
  async create(): Promise<INestApplication> {
    if (this.app) {
      return this.app;
    }

    this.module = await Test.createTestingModule({
      imports: [ApiAppModule],
    }).compile();

    this.app = this.module.createNestApplication();

    // ZodValidationPipe is already configured via APP_PIPE provider in SharedModule
    // No need to configure ValidationPipe manually

    await this.app.init();

    return this.app;
  }

  /**
   * Get HTTP server for supertest
   */
  async getHttpServer(): Promise<any> {
    const app = await this.create();
    return app.getHttpServer();
  }

  /**
   * Close application
   */
  async close(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
    }
    if (this.module) {
      await this.module.close();
      this.module = null;
    }
    // Give time for all async cleanup operations (Redis, NATS, etc.) to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Test API Client using supertest with in-memory application
 */
export class TestApiClient extends ApiClient {
  private factory: TestApplicationFactory;
  private httpServer: any = null;

  constructor(factory?: TestApplicationFactory) {
    super(''); // No base URL for supertest
    this.factory = factory || new TestApplicationFactory();
  }

  /**
   * Initialize HTTP server
   */
  async initialize(): Promise<void> {
    if (!this.httpServer) {
      this.httpServer = await this.factory.getHttpServer();
      this.agent = request(this.httpServer);
    }
  }

  /**
   * Close application
   */
  async close(): Promise<void> {
    await this.factory.close();
    this.httpServer = null;
    this.agent = null;
  }

  /**
   * POST request (with auto-initialization)
   */
  async post<T extends object = Record<string, any>>(path: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    await this.initialize();
    return super.post<T>(path, data, headers);
  }

  /**
   * GET request (with auto-initialization)
   */
  async get<T extends object = Record<string, any>>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    await this.initialize();
    return super.get<T>(path, headers);
  }

  /**
   * DELETE request (with auto-initialization)
   */
  async delete<T extends object = Record<string, any>>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    await this.initialize();
    return super.delete<T>(path, headers);
  }

  /**
   * PUT request (with auto-initialization)
   */
  async put<T extends object = Record<string, any>>(path: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    await this.initialize();
    return super.put<T>(path, data, headers);
  }

  /**
   * PATCH request (with auto-initialization)
   */
  async patch<T extends object = Record<string, any>>(path: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    await this.initialize();
    return super.patch<T>(path, data, headers);
  }
}

/**
 * External API Client (for real server)
 */
export class ExternalApiClient extends ApiClient {
  constructor(baseUrl: string = 'http://localhost:3000') {
    super(baseUrl);
  }
}

/**
 * API Client Factory
 * Flexible factory to switch between test and external modes
 */
export type ApiClientMode = 'test' | 'external';

export interface ApiClientConfig {
  mode?: ApiClientMode;
  baseUrl?: string;
  factory?: TestApplicationFactory;
}

/**
 * Create API client based on configuration
 */
export function createTestApiClient(config?: ApiClientConfig): ApiClient {
  const mode = config?.mode || (process.env.TEST_API_MODE as ApiClientMode) || 'test';

  if (mode === 'external') {
    return new ExternalApiClient(config?.baseUrl);
  }

  return new TestApiClient(config?.factory);
}

/**
 * Singleton test API client (default: in-memory)
 */
export const testApi = createTestApiClient();

/**
 * Factory instance for shared usage
 */
export const testAppFactory = new TestApplicationFactory();

