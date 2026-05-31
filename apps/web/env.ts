import { parseEnv, webEnvSchema, type WebEnv } from '@vivah/shared';

export const env: WebEnv = parseEnv(webEnvSchema, {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export const publicApiBaseUrl: string = env.NEXT_PUBLIC_API_BASE_URL;
