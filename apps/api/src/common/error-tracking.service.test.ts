import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('error tracking service', () => {
  const originalProvider = process.env.ERROR_TRACKING_PROVIDER;
  const originalWebhookUrl = process.env.ERROR_TRACKING_WEBHOOK_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    if (typeof originalProvider === 'undefined') {
      delete process.env.ERROR_TRACKING_PROVIDER;
    } else {
      process.env.ERROR_TRACKING_PROVIDER = originalProvider;
    }

    if (typeof originalWebhookUrl === 'undefined') {
      delete process.env.ERROR_TRACKING_WEBHOOK_URL;
    } else {
      process.env.ERROR_TRACKING_WEBHOOK_URL = originalWebhookUrl;
    }

    if (typeof originalNodeEnv === 'undefined') {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('no-ops when error tracking is disabled', async () => {
    process.env.ERROR_TRACKING_PROVIDER = 'none';
    delete process.env.ERROR_TRACKING_WEBHOOK_URL;

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { reportApplicationError } = await import('./error-tracking.service.js');
    const result = await reportApplicationError({
      source: 'startup',
      message: 'disabled path',
    });

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts structured payloads when webhook tracking is enabled', async () => {
    process.env.ERROR_TRACKING_PROVIDER = 'webhook';
    process.env.ERROR_TRACKING_WEBHOOK_URL = 'https://errors.example.com/collect';

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const { reportApplicationError } = await import('./error-tracking.service.js');
    const result = await reportApplicationError({
      source: 'express',
      message: 'boom',
      requestId: 'req_123',
      method: 'GET',
      url: '/api/test',
      statusCode: 500,
    });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://errors.example.com/collect',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      }),
    );

    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as { body?: string } | undefined)?.body ?? '{}',
    ) as Record<string, unknown>;

    expect(body).toMatchObject({
      service: 'vivah-api',
      environment: 'test',
      source: 'express',
      message: 'boom',
      requestId: 'req_123',
      method: 'GET',
      url: '/api/test',
      statusCode: 500,
    });
    expect(typeof body.timestamp).toBe('string');
  });
});
