import { env } from '../env.js';

export interface Email {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  sendEmail(email: Email): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(email: Email): Promise<void> {
    console.log('--- Email Sent ---');
    console.log(`To: ${email.to}`);
    console.log(`From: ${email.from ?? env.EMAIL_FROM}`);
    console.log(`Subject: ${email.subject}`);
    console.log('--- HTML Body ---');
    console.log(email.html);
    console.log('--- Text Body ---');
    console.log(email.text ?? '');
    console.log('--------------------');
    // In a real app, you wouldn't resolve here without sending,
    // but for the console provider, this is fine.
    return Promise.resolve();
  }
}

class SendGridEmailProvider implements EmailProvider {
  constructor(private readonly apiKey: string) {}

  async sendEmail(email: Email): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: email.to }] }],
        from: { email: email.from ?? env.EMAIL_FROM },
        subject: email.subject,
        content: [
          { type: 'text/plain', value: email.text ?? email.html.replace(/<[^>]+>/g, '') },
          { type: 'text/html', value: email.html },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid email failed: ${response.status}`);
    }
  }
}

class MailgunEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly domain: string,
  ) {}

  async sendEmail(email: Email): Promise<void> {
    const body = new URLSearchParams({
      from: email.from ?? env.EMAIL_FROM,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text ?? email.html.replace(/<[^>]+>/g, ''),
    });
    const response = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Mailgun email failed: ${response.status}`);
    }
  }
}

let provider: EmailProvider;

function getEmailProvider(): EmailProvider {
  if (provider) {
    return provider;
  }
  if (env.EMAIL_PROVIDER === 'sendgrid' && env.SENDGRID_API_KEY) {
    provider = new SendGridEmailProvider(env.SENDGRID_API_KEY);
    return provider;
  }
  if (env.EMAIL_PROVIDER === 'mailgun' && env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    provider = new MailgunEmailProvider(env.MAILGUN_API_KEY, env.MAILGUN_DOMAIN);
    return provider;
  }
  provider = new ConsoleEmailProvider();
  return provider;
}

export async function sendEmail(email: Email): Promise<void> {
  const emailProvider = getEmailProvider();
  await emailProvider.sendEmail(email);
}
