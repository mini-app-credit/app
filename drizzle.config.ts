import './src/shared/core/infrastructure/drizzle/load-env';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: 'src/shared/core/infrastructure/drizzle/schema/index.ts',
  dialect: 'postgresql',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_WRITE_URL!,
  },
});