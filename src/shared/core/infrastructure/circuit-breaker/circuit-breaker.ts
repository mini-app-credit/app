import { Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxCalls?: number;
  name?: string;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  halfOpenMaxCalls: 1,
  name: 'circuit-breaker',
};

export class CircuitBreaker<T> {
  private readonly logger: Logger;
  private readonly options: Required<CircuitBreakerOptions>;
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private halfOpenCalls = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private resetTimer?: NodeJS.Timeout;

  constructor(options: CircuitBreakerOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.logger = new Logger(`CircuitBreaker[${this.options.name}]`);
  }

  async execute(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitBreakerOpenError(this.options.name, this.lastFailureTime);
      }
    }

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
        throw new CircuitBreakerOpenError(this.options.name, this.lastFailureTime);
      }
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.failures = 0;
    this.successes = 0;
    this.halfOpenCalls = 0;
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }

  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.logger.log('Circuit breaker recovered, closing');
      this.reset();
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.logger.warn('Circuit breaker failed in half-open state, opening');
      this.transitionTo(CircuitState.OPEN);
      this.halfOpenCalls = 0;
      return;
    }

    if (this.failures >= this.options.failureThreshold) {
      this.logger.warn({ failureCount: this.failures }, 'Circuit breaker opened');
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    const elapsed = Date.now() - this.lastFailureTime.getTime();
    return elapsed >= this.options.resetTimeoutMs;
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      this.logger.debug({ fromState: this.state, toState: newState }, 'Circuit breaker state transition');
      this.state = newState;
    }
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly lastFailureTime?: Date,
  ) {
    super(`Circuit breaker [${circuitName}] is open`);
    this.name = 'CircuitBreakerOpenError';
  }
}
