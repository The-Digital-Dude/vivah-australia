import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);
const urlString = z.string().trim().url();

export const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');

export const apiEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: urlString,
  WEB_BASE_URL: urlString,
  MONGODB_URI: nonEmptyString,
  JWT_ACCESS_SECRET: nonEmptyString.min(32),
  JWT_REFRESH_SECRET: nonEmptyString.min(32),
  JWT_ACCESS_EXPIRES_IN: nonEmptyString.default('15m'),
  JWT_REFRESH_EXPIRES_IN: nonEmptyString.default('30d'),
  CORS_ORIGINS: nonEmptyString,
  ADMIN_SEED_EMAIL: z.string().trim().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().min(12).optional(),
  HCAPTCHA_SECRET: nonEmptyString.optional(),
  MEDIA_ACCESS_SECRET: nonEmptyString.min(32).optional(),
  CLOUDINARY_CLOUD_NAME: nonEmptyString.optional(),
  CLOUDINARY_API_KEY: nonEmptyString.optional(),
  CLOUDINARY_API_SECRET: nonEmptyString.optional(),
  STRIPE_SECRET_KEY: nonEmptyString.optional(),
  STRIPE_WEBHOOK_SECRET: nonEmptyString.optional(),
  STRIPE_PRICE_PREFIX: nonEmptyString.default('price_'),
  EMAIL_PROVIDER: z.enum(['console', 'sendgrid', 'mailgun']).default('console'),
  SENDGRID_API_KEY: nonEmptyString.optional(),
  MAILGUN_API_KEY: nonEmptyString.optional(),
  MAILGUN_DOMAIN: nonEmptyString.optional(),
  EMAIL_FROM: z.string().trim().email().default('noreply@vivahaustralia.com.au'),
  SMS_PROVIDER: z.enum(['console', 'twilio']).default('console'),
  TWILIO_ACCOUNT_SID: nonEmptyString.optional(),
  TWILIO_AUTH_TOKEN: nonEmptyString.optional(),
  TWILIO_FROM_NUMBER: nonEmptyString.optional(),
  PUSH_PROVIDER: z.enum(['console', 'webpush']).default('console'),
  WEB_PUSH_PUBLIC_KEY: nonEmptyString.optional(),
  WEB_PUSH_PRIVATE_KEY: nonEmptyString.optional(),
  ERROR_TRACKING_PROVIDER: z.enum(['none', 'webhook']).default('none'),
  ERROR_TRACKING_WEBHOOK_URL: nonEmptyString.optional(),
});

export const webEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  NEXT_PUBLIC_API_BASE_URL: urlString.default('http://localhost:4000'),
  NEXT_PUBLIC_HCAPTCHA_SITEKEY: nonEmptyString.optional(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;

export function parseEnv<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  env: Record<string, unknown>,
): z.output<TSchema> {
  return schema.parse(env) as z.output<TSchema>;
}
