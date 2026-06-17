import webpush from 'web-push';
import { env } from '../env.js';

export interface PushProvider {
  sendPush(input: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    title: string;
    body: string;
    data?: unknown;
  }): Promise<void>;
}

interface PushSendError {
  statusCode?: number;
}

class ConsolePushProvider implements PushProvider {
  sendPush(input: { endpoint: string; title: string; body: string; data?: unknown }) {
    console.info(
      `--- Push Sent ---\nEndpoint: ${input.endpoint}\nTitle: ${input.title}\nBody: ${input.body}\n-----------------`,
    );
    return Promise.resolve();
  }
}

class WebPushProvider implements PushProvider {
  constructor() {
    webpush.setVapidDetails(
      `mailto:${env.EMAIL_FROM}`,
      env.WEB_PUSH_PUBLIC_KEY!,
      env.WEB_PUSH_PRIVATE_KEY!,
    );
  }

  async sendPush(input: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    title: string;
    body: string;
    data?: unknown;
  }) {
    const subscription: webpush.PushSubscription = {
      endpoint: input.endpoint,
      keys: { p256dh: input.keys.p256dh, auth: input.keys.auth },
    };
    const payload = JSON.stringify({ title: input.title, body: input.body, data: input.data ?? {} });
    try {
      await webpush.sendNotification(subscription, payload);
    } catch (err: unknown) {
      // 410 Gone = subscription expired/unregistered — treat as a non-fatal miss
      if ((err as PushSendError).statusCode === 410) {
        console.warn(`Push subscription gone (410) for endpoint: ${input.endpoint.slice(0, 60)}…`);
        return;
      }
      throw err;
    }
  }
}

function buildProvider(): PushProvider {
  if (env.PUSH_PROVIDER === 'webpush' && env.WEB_PUSH_PUBLIC_KEY && env.WEB_PUSH_PRIVATE_KEY) {
    return new WebPushProvider();
  }
  if (env.PUSH_PROVIDER === 'webpush' && env.NODE_ENV === 'production') {
    throw new Error('WEB_PUSH_PUBLIC_KEY and WEB_PUSH_PRIVATE_KEY must be set in production when PUSH_PROVIDER=webpush');
  }
  return new ConsolePushProvider();
}

const provider: PushProvider = buildProvider();

export async function sendPush(input: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  title: string;
  body: string;
  data?: unknown;
}) {
  await provider.sendPush(input);
}
