import { parseEnv, webEnvSchema, type WebEnv } from '@vivah/shared';

export const env: WebEnv = parseEnv(webEnvSchema, {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_HCAPTCHA_SITEKEY: process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
  NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
});

export const publicApiBaseUrl: string = env.NEXT_PUBLIC_API_BASE_URL;
