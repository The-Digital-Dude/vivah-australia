import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('createApp', () => {
  const app = createApp({
    corsOrigins: ['http://localhost:3000'],
    auth: {
      accessSecret: 'test-access-secret-minimum-32-characters',
      refreshSecret: 'test-refresh-secret-minimum-32-characters',
      accessExpiresIn: '15m',
      refreshExpiresIn: '30d',
      exposeSensitiveTokens: true,
    },
  });

  it.each(['/health', '/api/health'])('serves %s', async (path) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
