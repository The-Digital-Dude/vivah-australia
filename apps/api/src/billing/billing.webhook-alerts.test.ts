import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthConfig } from '../auth/auth-types.js';

const authConfig: AuthConfig = {
  accessSecret: 'test-access-secret-minimum-32-characters',
  refreshSecret: 'test-refresh-secret-minimum-32-characters',
  accessExpiresIn: '15m',
  refreshExpiresIn: '30d',
  exposeSensitiveTokens: true,
};

describe('billing webhook failure alerts', () => {
  const reportApplicationError = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    vi.resetModules();
    reportApplicationError.mockClear();
  });

  afterEach(() => {
    vi.unmock('../common/error-tracking.service.js');
  });

  it('reports webhook verification failures through the error tracking service', async () => {
    vi.doMock('../common/error-tracking.service.js', () => ({
      reportApplicationError,
    }));

    const [{ createApp }, { env }] = await Promise.all([
      import('../app.js'),
      import('../env.js'),
    ]);

    const originalNodeEnv = env.NODE_ENV;
    env.NODE_ENV = 'production';

    try {
      const app = createApp({
        corsOrigins: ['http://localhost:3000'],
        auth: authConfig,
      });

      await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .send({
          id: 'evt_missing_signature',
          type: 'checkout.session.completed',
          data: { object: {} },
        })
        .expect(400);

      expect(reportApplicationError).toHaveBeenCalledTimes(1);
      expect(reportApplicationError).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'express',
          method: 'POST',
          url: '/api/billing/webhook',
          statusCode: 400,
        }),
      );
    } finally {
      env.NODE_ENV = originalNodeEnv;
    }
  });
});
