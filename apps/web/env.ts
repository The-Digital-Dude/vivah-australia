import { parseEnv, webEnvSchema, type WebEnv } from '@vivah/shared';

function trimEnv(value: string | undefined) {
  return value?.trim();
}

export const env: WebEnv = parseEnv(webEnvSchema, {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_BASE_URL: trimEnv(process.env.NEXT_PUBLIC_API_BASE_URL),
  NEXT_PUBLIC_TURNSTILE_SITEKEY: trimEnv(process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: trimEnv(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  NEXT_PUBLIC_GA4_ID: trimEnv(process.env.NEXT_PUBLIC_GA4_ID),
  NEXT_PUBLIC_META_PIXEL_ID: trimEnv(process.env.NEXT_PUBLIC_META_PIXEL_ID),
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: trimEnv(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION),
});

export const publicApiBaseUrl: string = env.NEXT_PUBLIC_API_BASE_URL;
