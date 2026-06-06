#!/usr/bin/env node
/**
 * scripts/env-check.mjs
 *
 * Validates that every environment variable required for production is present
 * and meets minimum length/format constraints.
 *
 * Usage:
 *   node scripts/env-check.mjs                  # reads from process.env
 *   node scripts/env-check.mjs --file apps/api/.env
 *
 * Exit codes:
 *   0  All required variables are present and valid.
 *   1  One or more variables are missing or invalid.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Parse optional --file flag ─────────────────────────────────────────────
const fileArgIndex = process.argv.indexOf('--file');
if (fileArgIndex !== -1) {
  const envFile = resolve(process.cwd(), process.argv[fileArgIndex + 1] ?? '.env');
  if (!existsSync(envFile)) {
    console.error(`❌  env-check: file not found: ${envFile}`);
    process.exit(1);
  }
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && val) process.env[key] = val;
  }
}

// ── Validation rules ───────────────────────────────────────────────────────
/** @type {Array<{ key: string; label: string; minLen?: number; validate?: (v: string) => boolean; hint?: string }>} */
const REQUIRED = [
  { key: 'API_BASE_URL',      label: 'API base URL',        validate: isUrl,    hint: 'must be a valid URL, e.g. https://api.vivahaustralia.com.au' },
  { key: 'WEB_BASE_URL',      label: 'Web base URL',        validate: isUrl,    hint: 'must be a valid URL, e.g. https://www.vivahaustralia.com.au' },
  { key: 'MONGODB_URI',       label: 'MongoDB URI',         minLen: 10,         hint: 'mongodb+srv://... or mongodb://...' },
  { key: 'JWT_ACCESS_SECRET', label: 'JWT access secret',   minLen: 32,         hint: 'must be at least 32 characters' },
  { key: 'JWT_REFRESH_SECRET',label: 'JWT refresh secret',  minLen: 32,         hint: 'must be at least 32 characters' },
  { key: 'CORS_ORIGINS',      label: 'CORS origins',        minLen: 5,          hint: 'comma-separated list of allowed origins' },
];

/** @type {Array<{ condition: () => boolean; key: string; label: string; minLen?: number; hint?: string }>} */
const CONDITIONAL = [
  {
    condition: () => process.env.EMAIL_PROVIDER === 'sendgrid',
    key: 'SENDGRID_API_KEY', label: 'SendGrid API key', minLen: 10,
    hint: 'required when EMAIL_PROVIDER=sendgrid',
  },
  {
    condition: () => process.env.EMAIL_PROVIDER === 'mailgun',
    key: 'MAILGUN_API_KEY', label: 'Mailgun API key', minLen: 10,
    hint: 'required when EMAIL_PROVIDER=mailgun',
  },
  {
    condition: () => process.env.EMAIL_PROVIDER === 'mailgun',
    key: 'MAILGUN_DOMAIN', label: 'Mailgun domain', minLen: 3,
    hint: 'required when EMAIL_PROVIDER=mailgun',
  },
  {
    condition: () => process.env.SMS_PROVIDER === 'twilio',
    key: 'TWILIO_ACCOUNT_SID', label: 'Twilio account SID', minLen: 10,
    hint: 'required when SMS_PROVIDER=twilio',
  },
  {
    condition: () => process.env.SMS_PROVIDER === 'twilio',
    key: 'TWILIO_AUTH_TOKEN', label: 'Twilio auth token', minLen: 10,
    hint: 'required when SMS_PROVIDER=twilio',
  },
  {
    condition: () => process.env.SMS_PROVIDER === 'twilio',
    key: 'TWILIO_FROM_NUMBER', label: 'Twilio from number', minLen: 5,
    hint: 'required when SMS_PROVIDER=twilio',
  },
  {
    condition: () => process.env.PUSH_PROVIDER === 'webpush',
    key: 'WEB_PUSH_PUBLIC_KEY', label: 'WebPush public key (VAPID)', minLen: 20,
    hint: 'required when PUSH_PROVIDER=webpush',
  },
  {
    condition: () => process.env.PUSH_PROVIDER === 'webpush',
    key: 'WEB_PUSH_PRIVATE_KEY', label: 'WebPush private key (VAPID)', minLen: 20,
    hint: 'required when PUSH_PROVIDER=webpush',
  },
  {
    condition: () => process.env.ERROR_TRACKING_PROVIDER === 'webhook',
    key: 'ERROR_TRACKING_WEBHOOK_URL', label: 'Error tracking webhook URL',
    validate: isUrl, hint: 'required when ERROR_TRACKING_PROVIDER=webhook',
  },
  {
    condition: () => Boolean(process.env.STRIPE_SECRET_KEY),
    key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe webhook secret', minLen: 10,
    hint: 'required when STRIPE_SECRET_KEY is set',
  },
  {
    condition: () => Boolean(process.env.STRIPE_SECRET_KEY),
    key: 'MEDIA_ACCESS_SECRET', label: 'Media access secret', minLen: 32,
    hint: 'required in production for signed private media access',
  },
];

// ── Helper functions ───────────────────────────────────────────────────────
function isUrl(value) {
  try { new URL(value); return true; } catch { return false; }
}

function check({ key, label, minLen, validate, hint }) {
  const value = (process.env[key] ?? '').trim();
  if (!value) return `Missing: ${key} — ${label}${hint ? ` (${hint})` : ''}`;
  if (minLen && value.length < minLen) return `Too short: ${key} — ${label} must be at least ${minLen} characters`;
  if (validate && !validate(value)) return `Invalid: ${key} — ${label}${hint ? ` (${hint})` : ''}`;
  return null;
}

// ── Run checks ─────────────────────────────────────────────────────────────
const errors = [];

for (const rule of REQUIRED) {
  const err = check(rule);
  if (err) errors.push(err);
}

for (const rule of CONDITIONAL) {
  if (rule.condition()) {
    const err = check(rule);
    if (err) errors.push(err);
  }
}

// ── Report ─────────────────────────────────────────────────────────────────
if (errors.length === 0) {
  console.log('✅  env-check: all required environment variables are present and valid.');
  process.exit(0);
} else {
  console.error(`\n❌  env-check: ${errors.length} environment variable problem${errors.length === 1 ? '' : 's'} found:\n`);
  for (const err of errors) {
    console.error(`   • ${err}`);
  }
  console.error('\nFix the above issues in your .env file (or GitHub / Railway / Vercel secrets) before deploying.\n');
  process.exit(1);
}
