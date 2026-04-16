import Redis from 'ioredis';

/**
 * Test Redis Client - Uses separate test instance
 */
let testRedisClient: Redis | null = null;

export async function initializeTestRedis() {
  if (testRedisClient) return testRedisClient;

  const host = process.env.REDIS_HOST || 'localhost';
  const port = Number(process.env.REDIS_PORT || '6380');
  const database = Number(process.env.REDIS_DATABASE || '0');

  testRedisClient = new Redis({
    host,
    port,
    db: database,
    retryStrategy: () => null,
    enableAutoPipelining: false,
  });

  testRedisClient.on('error', (err) => {
    console.error('Test Redis error:', err);
  });

  return testRedisClient;
}

export async function closeTestRedis() {
  if (testRedisClient) {
    try {
      // Remove all listeners to prevent "Connection is closed" errors
      testRedisClient.removeAllListeners();

      // Use quit() instead of disconnect() to gracefully close connection
      // quit() waits for all pending commands to complete
      await Promise.race([
        testRedisClient.quit(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis quit timeout')), 1000)),
      ]);
    } catch (error) {
      // If quit() fails or times out, force disconnect
      // This can happen if connection is already closed or hung
      try {
        testRedisClient.disconnect(false);
      } catch (disconnectError) {
        // Ignore disconnect errors - connection might already be closed
      }
    } finally {
      testRedisClient = null;
    }
  }
}

export function getTestRedis(): Redis {
  if (!testRedisClient) {
    throw new Error('Test Redis not initialized. Call initializeTestRedis() first.');
  }
  return testRedisClient;
}

/**
 * Clear all test data from Redis
 */
export async function clearTestRedis() {
  const redis = getTestRedis();
  await redis.flushdb();
}

/**
 * Count keys matching pattern
 */
export async function countRedisKeys(pattern: string = '*'): Promise<number> {
  const redis = getTestRedis();
  const keys = await redis.keys(pattern);
  return keys.length;
}

/**
 * Get all keys matching pattern
 */
export async function getRedisKeys(pattern: string = '*'): Promise<string[]> {
  const redis = getTestRedis();
  return redis.keys(pattern);
}

/**
 * Check if key exists
 */
export async function redisKeyExists(key: string): Promise<boolean> {
  const redis = getTestRedis();
  const exists = await redis.exists(key);
  return exists === 1;
}

/**
 * Get value by key
 */
export async function getRedisValue(key: string): Promise<string | null> {
  const redis = getTestRedis();
  return redis.get(key);
}

/**
 * Verify Redis is empty (no keys)
 */
export async function verifyRedisEmpty(): Promise<boolean> {
  const count = await countRedisKeys();
  return count === 0;
}

/**
 * Verify all IAM-related keys are cleared
 */
export async function verifyIAMKeysCleared(): Promise<boolean> {
  const patterns = [
    'iam:*',
    'iam:password_reset:*',
    'iam:email_verification:*',
    'iam:token:*',
  ];

  for (const pattern of patterns) {
    const count = await countRedisKeys(pattern);
    if (count > 0) {
      return false;
    }
  }

  return true;
}

export const testRedis = {
  initialize: initializeTestRedis,
  close: closeTestRedis,
  get: getTestRedis,
  clear: clearTestRedis,
  countKeys: countRedisKeys,
  getKeys: getRedisKeys,
  keyExists: redisKeyExists,
  getValue: getRedisValue,
  verifyEmpty: verifyRedisEmpty,
  verifyIAMKeysCleared,
};

