
import { env } from '../env.js';

export interface Email {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  sendEmail(email: Email): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(email: Email): Promise<void> {
    console.log('--- Email Sent ---');
    console.log(`To: ${email.to}`);
    console.log(`From: ${email.from}`);
    console.log(`Subject: ${email.subject}`);
    console.log('--- HTML Body ---');
    console.log(email.html);
    console.log('--- Text Body ---');
    console.log(email.text);
    console.log('--------------------');
    // In a real app, you wouldn't resolve here without sending,
    // but for the console provider, this is fine.
    return Promise.resolve();
  }
}

// In the future, you could add:
// class SendGridEmailProvider implements EmailProvider { ... }
// class MailgunEmailProvider implements EmailProvider { ... }

let provider: EmailProvider;

function getEmailProvider(): EmailProvider {
  if (provider) {
    return provider;
  }
  // For now, we only have one provider.
  // In the future, you could use env.EMAIL_PROVIDER to switch.
  provider = new ConsoleEmailProvider();
  return provider;
}

export async function sendEmail(email: Email): Promise<void> {
  const emailProvider = getEmailProvider();
  await emailProvider.sendEmail(email);
}
