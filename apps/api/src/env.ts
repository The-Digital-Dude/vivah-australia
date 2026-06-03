import { config } from 'dotenv';
import { apiEnvSchema, parseEnv, type ApiEnv } from '@vivah/shared';
import * as path from 'path';

if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  config({ path: path.join(__dirname, '../.env.example') });
} else {
  config();
}

// Clean up empty string values so they resolve to undefined and satisfy Zod optional schemas
for (const key of Object.keys(process.env)) {
  if (process.env[key] === '') {
    delete process.env[key];
  }
}

export const env: ApiEnv = parseEnv(apiEnvSchema, process.env);
