import { env } from '../env.js';

export interface PushProvider {
  sendPush(input: { endpoint: string; title: string; body: string; data?: unknown }): Promise<void>;
}

class ConsolePushProvider implements PushProvider {
  sendPush(input: { endpoint: string; title: string; body: string; data?: unknown }) {
    console.info(
      `--- Push Sent ---\nEndpoint: ${input.endpoint}\nTitle: ${input.title}\nBody: ${input.body}\n-----------------`,
    );
    return Promise.resolve();
  }
}

class WebPushPlaceholderProvider implements PushProvider {
  sendPush(input: { endpoint: string; title: string; body: string; data?: unknown }) {
    if (!env.WEB_PUSH_PUBLIC_KEY || !env.WEB_PUSH_PRIVATE_KEY) {
      return Promise.reject(new Error('Web push provider is not configured'));
    }

    console.info(
      `--- WebPush Placeholder ---\nEndpoint: ${input.endpoint}\nTitle: ${input.title}\nBody: ${input.body}\n---------------------------`,
    );
    return Promise.resolve();
  }
}

const provider: PushProvider =
  env.PUSH_PROVIDER === 'webpush' ? new WebPushPlaceholderProvider() : new ConsolePushProvider();

export async function sendPush(input: {
  endpoint: string;
  title: string;
  body: string;
  data?: unknown;
}) {
  await provider.sendPush(input);
}
