import { env } from '../env.js';

export interface ErrorTrackingEvent {
  source: 'express' | 'startup' | 'uncaughtException' | 'unhandledRejection';
  message: string;
  stack?: string;
  requestId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
}

function runtimeConfig() {
  const provider = process.env.ERROR_TRACKING_PROVIDER ?? env.ERROR_TRACKING_PROVIDER;
  const webhookUrl = process.env.ERROR_TRACKING_WEBHOOK_URL ?? env.ERROR_TRACKING_WEBHOOK_URL;
  const environment = process.env.NODE_ENV ?? env.NODE_ENV;

  return {
    provider,
    webhookUrl,
    environment,
  };
}

export function isErrorTrackingEnabled() {
  const config = runtimeConfig();
  return config.provider === 'webhook' && !!config.webhookUrl;
}

function buildPayload(event: ErrorTrackingEvent) {
  const config = runtimeConfig();
  return {
    timestamp: new Date().toISOString(),
    service: 'vivah-api',
    environment: config.environment,
    ...event,
  };
}

export async function reportApplicationError(event: ErrorTrackingEvent) {
  const config = runtimeConfig();

  if (!isErrorTrackingEnabled() || !config.webhookUrl) {
    return false;
  }

  const payload = buildPayload(event);

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          service: 'vivah-api',
          event: 'ERROR_TRACKING_FAILED',
          originalSource: event.source,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
    return false;
  }
}
