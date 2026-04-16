import * as request from 'supertest';

/**
 * API Client using Supertest
 * Fluent API for testing HTTP endpoints
 */
export class ApiClient {
  protected agent: any;
  private baseUrl: string;
  private lastResponse: any;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.agent = request(baseUrl);
  }

  /**
   * POST request
   */
  async post<T extends object = Record<string, any>>(path: string, data?: any, headers?: Record<string, string>) {
    this.lastResponse = await this.agent.post(path).set(headers ?? {}).send(data);
    return new ApiResponse<T>(this.lastResponse);
  }

  /**
   * GET request
   */
  async get<T extends object = Record<string, any>>(path: string, headers?: Record<string, string>) {
    this.lastResponse = await this.agent.get(path).set(headers ?? {});
    return new ApiResponse<T>(this.lastResponse);
  }

  /**
   * DELETE request
   */
  async delete<T extends object = Record<string, any>>(path: string, headers?: Record<string, string>) {
    this.lastResponse = await this.agent.delete(path).set(headers ?? {});
    return new ApiResponse<T>(this.lastResponse);
  }

  /**
   * PUT request
   */
  async put<T extends object = Record<string, any>>(path: string, data?: any, headers?: Record<string, string>) {
    this.lastResponse = await this.agent.put(path).set(headers ?? {}).send(data);
    return new ApiResponse<T>(this.lastResponse);
  }

  /**
   * PATCH request
   */
  async patch<T extends object = Record<string, any>>(path: string, data?: any, headers?: Record<string, string>) {
    this.lastResponse = await this.agent.patch(path).set(headers ?? {}).send(data);
    return new ApiResponse<T>(this.lastResponse);
  }

  /**
   * Create authorization header with bearer token
   */
  withBearerToken(token: string, additionalHeaders?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
  }

  /**
   * Get last response
   */
  getLastResponse() {
    return this.lastResponse;
  }

  /**
   * Get base URL
   */
  getBaseUrl() {
    return this.baseUrl;
  }
}

/**
 * API Response Wrapper with Fluent API
 */
export class ApiResponse<T extends object = Record<string, any>> {
  status: number;
  body: T;
  headers: Record<string, any>;

  constructor(response: any) {
    this.status = response.status;
    this.body = response.body;
    this.headers = response.headers;
  }

  /**
   * Assert status code
   */
  expectStatus(expected: number): ApiResponse<T> {
    if (this.status !== expected) {
      throw new Error(
        `Expected status ${expected}, got ${this.status}. Body: ${JSON.stringify(this.body)}`
      );
    }
    return this;
  }

  /**
   * Assert 2xx status
   */
  expectSuccess(): ApiResponse<T> {
    if (this.status < 200 || this.status >= 300) {
      throw new Error(
        `Expected successful response (2xx), got ${this.status}. Body: ${JSON.stringify(this.body)}`
      );
    }
    return this;
  }

  /**
   * Assert 4xx/5xx status
   */
  expectError(): ApiResponse<T> {
    if (this.status < 400) {
      throw new Error(
        `Expected error response (4xx/5xx), got ${this.status}. Body: ${JSON.stringify(this.body)}`
      );
    }
    return this;
  }

  /**
   * Get response body
   */
  getBody(): T {
    return this.body;
  }

  /**
   * Get specific header (case-insensitive)
   */
  getHeader(name: string): string | undefined {
    return this.headers[name.toLowerCase()];
  }

  /**
   * Assert header exists
   */
  expectHeader(name: string): ApiResponse<T> {
    const value = this.getHeader(name);
    if (!value) {
      throw new Error(`Expected header '${name}' to be present`);
    }
    return this;
  }

  /**
   * Assert header has specific value
   */
  expectHeaderValue(name: string, value: string): ApiResponse<T> {
    const headerValue = this.getHeader(name);
    if (headerValue !== value) {
      throw new Error(
        `Expected header '${name}' to be '${value}', got '${headerValue}'`
      );
    }
    return this;
  }

  /**
   * Assert body has property
   */
  expectBodyProperty(property: string, value?: any): ApiResponse<T> {
    if (!(property in this.body)) {
      throw new Error(
        `Expected response body to have property '${property}'. Body: ${JSON.stringify(this.body)}`
      );
    }
    if (value !== undefined && this.body[property as keyof T] !== value) {
      throw new Error(
        `Expected '${property}' to be '${value}', got '${this.body[property as keyof T]}'`
      );
    }
    return this;
  }

  /**
   * Assert body does NOT have property
   */
  expectBodyNotProperty(property: string): ApiResponse<T> {
    if (property in this.body) {
      throw new Error(
        `Expected response body NOT to have property '${property}'`
      );
    }
    return this;
  }

  /**
   * Fluent chainable assertions
   */
  expect(matcher: (body: T) => boolean): ApiResponse<T> {
    if (!matcher(this.body)) {
      throw new Error(
        `Custom assertion failed. Body: ${JSON.stringify(this.body)}`
      );
    }
    return this;
  }
}

/**
 * Create API client
 */
export function createApiClient(baseUrl?: string): ApiClient {
  return new ApiClient(baseUrl);
}

/**
 * Export singleton for tests
 */
export const api = createApiClient();
