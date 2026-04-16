import { Logger, Provider } from "@nestjs/common";
import { SHARED_DI_TOKENS } from "../infrastructure/constants";
import { loadDrizzleConfig, DatabaseConfig } from "../infrastructure/drizzle";
import { Pool } from 'pg';
import * as schema from '../infrastructure/drizzle/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { withReplicas } from 'drizzle-orm/pg-core';
import { Argon2HashService } from "../infrastructure/hash";
import { amplitude, AmplitudeConfig, configs, loadAmplitudeConfig, loadRedisConfig, loadS3Config, RedisConfig, RedisService, S3Config, TokenBucketRateLimitService } from "../infrastructure";
import Redis, { RedisOptions } from 'ioredis';
import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { fromTemporaryCredentials, fromEnv } from "@aws-sdk/credential-providers";
import { APP_GUARD, APP_PIPE, Reflector } from "@nestjs/core";
import { ZodValidationPipe } from "@anatine/zod-nestjs";
import { RateLimitService } from "../application";
import { RateLimitGuard } from "./guards";
import { MigrationBootstrapService } from "../infrastructure/migrations/migration-bootstrap.service";

const drizzleConfigProvider: Provider = {
  provide: SHARED_DI_TOKENS.DATABASE_CONFIG,
  useValue: loadDrizzleConfig.from.env(process.env),
}

const drizzleClientProvider: Provider = {
  provide: SHARED_DI_TOKENS.DATABASE_CLIENT,
  inject: [SHARED_DI_TOKENS.DATABASE_CONFIG],
  useFactory: (config: DatabaseConfig) => {
    const cfg = {
      connectionString: config.DATABASE_WRITE_URL,
    };

    const primaryPool = new Pool(cfg);

    const primaryDb = drizzle(primaryPool, { schema });

    const replicas = config.DATABASE_READ_REPLICA_URLS.map((url) => {
      const pool = new Pool({ connectionString: url });

      return drizzle(pool, { schema });
    });

    const db =
      replicas.length > 0
        ? withReplicas(
          primaryDb,
          replicas as [typeof primaryDb, ...(typeof primaryDb)[]],
        )
        : primaryDb;

    return db;
  }
}

const databaseProviders = [
  drizzleConfigProvider,
  drizzleClientProvider,
];

export const hashServiceProvider: Provider = {
  provide: SHARED_DI_TOKENS.HASH_SERVICE,
  useClass: Argon2HashService,
}

const redisConfigProvider: Provider = {
  provide: SHARED_DI_TOKENS.REDIS_CONFIG,
  useValue: loadRedisConfig.from.env(process.env),
}

const redisClientProvider: Provider = {
  provide: SHARED_DI_TOKENS.REDIS_CLIENT,
  useFactory: (config: RedisConfig) => {
    const options: RedisOptions = {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      db: config.REDIS_DATABASE,
      tls: config.REDIS_TLS ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      reconnectOnError(err) {
        const target = 'READONLY';
        return err.message.includes(target) ? true : false;
      },
      enableAutoPipelining: true,
    };

    const client = new Redis(options);

    const logger = new Logger('Redis');

    client.on('error', (e) => logger.error(`Redis error`, e.stack));
    client.on('reconnecting', () => logger.warn('[Redis] reconnecting...'));
    client.on('connect', () => logger.log('[Redis] connected'));

    return client;
  },
  inject: [SHARED_DI_TOKENS.REDIS_CONFIG],
}

const redisServiceProvider: Provider = {
  provide: SHARED_DI_TOKENS.REDIS_SERVICE,
  useClass: RedisService,
}

export const redisServiceProviders = [
  redisConfigProvider,
  redisClientProvider,
  redisServiceProvider,
]

const s3ConfigProvider: Provider = {
  provide: SHARED_DI_TOKENS.S3_CONFIG,
  useValue: loadS3Config.from.env(process.env),
}

const s3ClientProvider: Provider = {
  provide: SHARED_DI_TOKENS.S3_CLIENT,
  useFactory: (config: S3Config) => {
    const endpoint = config.S3_ENDPOINT.endsWith('/')
      ? config.S3_ENDPOINT.slice(0, -1)
      : config.S3_ENDPOINT;

    const clientConfig: S3ClientConfig = {
      region: config.S3_REGION,
      endpoint,
      forcePathStyle: config.S3_FORCE_PATH_STYLE,
    };

    if (config.S3_ROLE_ARN) {
      clientConfig.credentials = fromTemporaryCredentials({
        params: {
          RoleArn: config.S3_ROLE_ARN,
        },
      });
    } else {
      clientConfig.credentials = fromEnv();
    }

    const client = new S3Client(clientConfig);

    return client;
  },
  inject: [SHARED_DI_TOKENS.S3_CONFIG],
}

export const s3ServiceProviders = [
  s3ConfigProvider,
  s3ClientProvider,
]

const zodValidationPipeProvider: Provider = {
  provide: APP_PIPE,
  useClass: ZodValidationPipe,
}


const rateLimitServiceProvider: Provider = {
  provide: SHARED_DI_TOKENS.RATE_LIMIT_SERVICE,
  useFactory: (redisService: RedisService) => {
    return new TokenBucketRateLimitService(redisService.getClient(), configs);
  },
  inject: [SHARED_DI_TOKENS.REDIS_SERVICE],
};

const rateLimitGuardProvider: Provider = {
  provide: APP_GUARD,
  useFactory: (reflector: Reflector, rateLimitService: RateLimitService) => {
    return new RateLimitGuard(reflector, rateLimitService, configs);
  },
  inject: [Reflector, SHARED_DI_TOKENS.RATE_LIMIT_SERVICE],
};

export const rateLimitServiceProviders = [
  rateLimitServiceProvider,
  rateLimitGuardProvider,
];

const amplitudeConfigProvider: Provider = {
  provide: SHARED_DI_TOKENS.AMPLITUDE_CONFIG,
  useValue: loadAmplitudeConfig.from.env(process.env),
}

const amplitudeClientProvider: Provider = {
  provide: SHARED_DI_TOKENS.AMPLITUDE_CLIENT,
  useFactory: (config: AmplitudeConfig) => {
    amplitude.init(config.AMPLITUDE_API_KEY);
    return amplitude;
  },
  inject: [SHARED_DI_TOKENS.AMPLITUDE_CONFIG],
}

export const amplitudeServiceProviders = [
  amplitudeConfigProvider,
  amplitudeClientProvider,
]

export const sharedProvider = [
  ...databaseProviders,
  MigrationBootstrapService,
  hashServiceProvider,
  ...redisServiceProviders,
  ...s3ServiceProviders,
  zodValidationPipeProvider,
  ...rateLimitServiceProviders,
  ...amplitudeServiceProviders,
];

export const exportedProviders = [...databaseProviders, hashServiceProvider, ...redisServiceProviders, ...s3ServiceProviders, rateLimitServiceProvider, ...amplitudeServiceProviders];
