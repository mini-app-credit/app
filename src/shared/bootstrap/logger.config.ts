import { Params } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import z from 'zod';
import { CORRELATION_ID_HEADER, getCorrelationId } from '../core/infrastructure';

export const loggerConfigSchema = z.object({
  LEVEL: z.string().default('info'),
  NODE_ENV: z.string().default('development'),
  NAME: z.string().default('app'),
});

export type LoggerConfig = z.infer<typeof loggerConfigSchema>;

export const load = {
  from: {
    env: (env: NodeJS.ProcessEnv) => {
      return loggerConfigSchema.parse(env);
    },
  },
};

export const loggerOptions = (): Params => {
  const config = load.from.env(process.env);

  const isProduction = config.NODE_ENV === 'production';

  const defaultOptions: Params = {
    pinoHttp: {
      level: config.LEVEL,
      genReqId: (req) => {
        return (
          (req.headers[CORRELATION_ID_HEADER] as string) ||
          getCorrelationId() ||
          randomUUID()
        );
      },
      customProps: () => ({
        service: config.NAME,
        correlationId: getCorrelationId(),
      }),
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie'],
        remove: true,
      },
    },
  };

  if (isProduction) return defaultOptions;

  return {
    ...defaultOptions,
    pinoHttp: {
      ...defaultOptions.pinoHttp,
      transport: {
        target: 'pino-pretty',
        options: {
          singleLine: true,
          colorize: true,
          ignore: 'pid,hostname',
        },
      },
    },
  };
};
