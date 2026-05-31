import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('createApp', () => {
  it('serves the health endpoint', async () => {
    const response = await request(
      createApp({
        corsOrigins: ['http://localhost:3000'],
        auth: {
          accessSecret: 'test-access-secret-minimum-32-characters',
          refreshSecret: 'test-refresh-secret-minimum-32-characters',
          accessExpiresIn: '15m',
          refreshExpiresIn: '30d',
          exposeSensitiveTokens: true,
        },
      }),
    ).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
