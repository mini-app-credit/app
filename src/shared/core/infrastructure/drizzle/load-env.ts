import { config } from 'dotenv';

let loaded = false;

/** Loads .env from cwd once; safe to call multiple times. */
export function loadEnv(): void {
  if (loaded) return;
  config();
  loaded = true;
}

loadEnv();
