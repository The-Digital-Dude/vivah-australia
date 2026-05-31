import { describe, expect, it } from 'vitest';
import { parseEnv, apiEnvSchema, registerEmailSchema } from './index.js';

describe('registerEmailSchema', () => {
  it('accepts a strong registration payload', () => {
    const parsed = registerEmailSchema.parse({
      email: ' USER@Example.COM ',
      password: 'StrongPassword123!',
      firstName: 'Amit',
      lastName: 'Sharma',
      termsAccepted: true,
      marketingConsent: false,
    });

    expect(parsed.email).toBe('user@example.com');
  });

  it('rejects missing terms acceptance', () => {
    expect(() =>
      registerEmailSchema.parse({
        email: 'user@example.com',
        password: 'StrongPassword123!',
        firstName: 'Amit',
        lastName: 'Sharma',
        termsAccepted: false,
      }),
    ).toThrow();
  });
});

describe('apiEnvSchema', () => {
  it('parses valid API env and coerces the port', () => {
    const parsed = parseEnv(apiEnvSchema, {
      NODE_ENV: 'test',
      API_PORT: '4000',
      API_BASE_URL: 'http://localhost:4000',
      WEB_BASE_URL: 'http://localhost:3000',
      MONGODB_URI: 'mongodb://localhost:27017/vivah_test',
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      CORS_ORIGINS: 'http://localhost:3000',
    });

    expect(parsed.API_PORT).toBe(4000);
  });
});
