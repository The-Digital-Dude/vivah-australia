import { env } from '../env.js';

export interface SmsProvider {
  sendSms(input: { to: string; message: string }): Promise<void>;
}

class ConsoleSmsProvider implements SmsProvider {
  sendSms(input: { to: string; message: string }) {
    console.info(`--- SMS Sent ---\nTo: ${input.to}\n${input.message}\n----------------`);
    return Promise.resolve();
  }
}

class TwilioSmsProvider implements SmsProvider {
  async sendSms(input: { to: string; message: string }) {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
      throw new Error('Twilio SMS provider is not configured');
    }

    const credentials = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString(
      'base64',
    );
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: env.TWILIO_FROM_NUMBER,
          To: input.to,
          Body: input.message,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Twilio SMS send failed');
    }
  }
}

const provider: SmsProvider =
  env.SMS_PROVIDER === 'twilio' ? new TwilioSmsProvider() : new ConsoleSmsProvider();

export async function sendSms(input: { to: string; message: string }) {
  await provider.sendSms(input);
}
