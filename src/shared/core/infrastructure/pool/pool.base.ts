import { Logger, OnModuleDestroy } from '@nestjs/common';
import { PoolConfig } from './pool.config';

export interface PoolEntry<V> {
  value: V;
  createdAt: number;
  lastActivityAt: number;
}

export abstract class Pool<K, V> implements OnModuleDestroy {
  protected readonly logger: Logger;
  protected readonly entries = new Map<K, PoolEntry<V>>();
  protected cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    protected readonly config: PoolConfig,
    loggerContext: string,
  ) {
    this.logger = new Logger(loggerContext);
    this.startCleanupTimer();
  }

  /**
   * Called when an entry is evicted from the pool.
   * Subclass implements resource-specific cleanup logic.
   */
  protected abstract onEvict(key: K, entry: PoolEntry<V>): void | Promise<void>;

  protected startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup().catch((err) => {
        this.logger.error({ err }, 'Pool cleanup failed');
      });
    }, this.config.cleanupIntervalMs);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    await this.closeAll();
  }

  get(key: K): PoolEntry<V> | undefined {
    return this.entries.get(key);
  }

  set(key: K, value: V): void {
    if (this.entries.size >= this.config.maxSize && !this.entries.has(key)) {
      this.logger.warn({ poolMaxSize: this.config.maxSize }, 'Pool limit reached, evicting oldest entry');
      this.evictOldest();
    }

    const now = Date.now();
    const entry: PoolEntry<V> = {
      value,
      createdAt: now,
      lastActivityAt: now,
    };

    this.entries.set(key, entry);
    this.logger.debug({ poolSize: this.entries.size }, 'Pool entry added');
  }

  delete(key: K): boolean {
    const entry = this.entries.get(key);
    if (!entry) {
      return false;
    }

    try {
      this.onEvict(key, entry);
    } catch (error) {
      this.logger.warn({ err: error }, 'Failed to evict pool entry');
    }

    const deleted = this.entries.delete(key);
    if (deleted) {
      this.logger.debug({ poolSize: this.entries.size }, 'Pool entry removed');
    }
    return deleted;
  }

  has(key: K): boolean {
    return this.entries.has(key);
  }

  size(): number {
    return this.entries.size;
  }

  updateActivity(key: K): void {
    const entry = this.entries.get(key);
    if (entry) {
      entry.lastActivityAt = Date.now();
    }
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    const expiredKeys: K[] = [];

    for (const [key, entry] of this.entries) {
      const idleTime = now - entry.lastActivityAt;
      if (idleTime > this.config.idleTimeoutMs) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.logger.log({ evictedCount: expiredKeys.length, remainingPoolSize: this.entries.size }, 'Pool cleanup completed');
    }

    return expiredKeys.length;
  }

  async closeAll(): Promise<void> {
    const keys = Array.from(this.entries.keys());

    for (const key of keys) {
      this.delete(key);
    }

    this.logger.log({ closedCount: keys.length }, 'Pool closed all entries');
  }

  protected evictOldest(): void {
    let oldestKey: K | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.entries) {
      if (entry.lastActivityAt < oldestTime) {
        oldestTime = entry.lastActivityAt;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      this.delete(oldestKey);
      this.logger.debug('Evicted oldest pool entry');
    }
  }

  getStats(): {
    size: number;
    maxSize: number;
    oldestAgeMs: number;
    newestAgeMs: number;
  } {
    const now = Date.now();
    let oldestAge = 0;
    let newestAge = Infinity;

    for (const entry of this.entries.values()) {
      const age = now - entry.createdAt;
      if (age > oldestAge) oldestAge = age;
      if (age < newestAge) newestAge = age;
    }

    return {
      size: this.entries.size,
      maxSize: this.config.maxSize,
      oldestAgeMs: oldestAge,
      newestAgeMs: this.entries.size > 0 ? newestAge : 0,
    };
  }
}
