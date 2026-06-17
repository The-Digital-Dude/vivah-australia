import crypto from 'crypto';
import type { Types } from 'mongoose';
import { TemplateModel } from '../models/index.js';
import { env } from '../env.js';
import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { redisClient } from './redis.js';

const redisConnection = redisClient;
const queueConnection = redisConnection as ConnectionOptions | null;

export const emailQueue = queueConnection
  ? new Queue('emailQueue', { connection: queueConnection })
  : null;

const emailWorker = queueConnection
  ? new Worker('emailQueue', async (job) => {
      const emailProvider = getEmailProvider();
      await emailProvider.sendEmail(job.data as Email);
    }, { connection: queueConnection })
  : null;

emailWorker?.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err);
});

export function generateUnsubscribeToken(userId: Types.ObjectId): string {
  return crypto
    .createHmac('sha256', env.JWT_ACCESS_SECRET)
    .update(String(userId))
    .digest('hex');
}

export function buildUnsubscribeUrl(userId: Types.ObjectId): string {
  const token = generateUnsubscribeToken(userId);
  return `${env.API_BASE_URL}/api/public/unsubscribe?userId=${String(userId)}&token=${token}`;
}

const UNSUBSCRIBE_FOOTER = (url: string) => `
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-family:sans-serif;font-size:12px;color:#9ca3af;">
    <p>You're receiving this email because you are a member of Vivah Australia.</p>
    <p><a href="${url}" style="color:#A10E4D;text-decoration:underline;">Unsubscribe from marketing emails</a></p>
  </div>
`;

export interface Email {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  isMarketing?: boolean;
  recipientUserId?: Types.ObjectId;
}

export interface EmailProvider {
  sendEmail(email: Email): Promise<void>;
}

export interface EmailTemplateContext {
  [key: string]: unknown;
}

interface EmailTemplateRecord {
  subject?: string;
  body: string;
}

export interface TemplatedEmail extends Omit<Email, 'subject' | 'html' | 'text'> {
  templateKey: string;
  context?: EmailTemplateContext;
  subjectFallback: string;
  textFallback?: string;
  htmlFallback?: string;
  isMarketing?: boolean;
  recipientUserId?: Types.ObjectId;
}

type RenderValue = string | number | boolean | null | undefined;



function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toStringValue(value: RenderValue) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function getPathValue(context: EmailTemplateContext, path: string) {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, context);
}

function renderTemplateString(
  template: string,
  context: EmailTemplateContext = {},
  options: { html?: boolean } = {},
) {
  const withRawValues = template.replace(/{{{\s*([\w.-]+)\s*}}}/g, (_match, key: string) => {
    const value = getPathValue(context, key);
    return toStringValue(value as RenderValue);
  });

  return withRawValues.replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key: string) => {
    const value = getPathValue(context, key);
    const rendered = toStringValue(value as RenderValue);
    return options.html ? escapeHtml(rendered) : rendered;
  });
}

async function loadEmailTemplate(key: string): Promise<EmailTemplateRecord | null> {
  return (await TemplateModel.findOne({ key, type: 'EMAIL', isDeleted: false }).lean().exec()) as
    | EmailTemplateRecord
    | null;
}

function stripHtmlTags(value: string) {
  return value.replace(/<[^>]+>/g, '');
}

class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(email: Email): Promise<void> {
    if (env.NODE_ENV === 'production') {
      throw new Error('Console email provider cannot be used in a production environment.');
    }
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
  if (env.NODE_ENV === 'production') {
    throw new Error('Console email provider cannot be used in a production environment.');
  }
  provider = new ConsoleEmailProvider();
  return provider;
}

export async function sendEmail(email: Email): Promise<void> {
  const finalEmail: Email = { ...email };
  if (email.isMarketing && email.recipientUserId) {
    const unsubUrl = buildUnsubscribeUrl(email.recipientUserId);
    finalEmail.html = email.html + UNSUBSCRIBE_FOOTER(unsubUrl);
    finalEmail.text = (email.text ?? '') + `\n\nTo unsubscribe from marketing emails, visit: ${unsubUrl}`;
  }
  // Strip internal-only fields before queuing/sending
  const sendable: Email = { ...finalEmail };
  delete sendable.isMarketing;
  delete sendable.recipientUserId;

  if (emailQueue) {
    await emailQueue.add('sendEmail', sendable, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  } else {
    // Redis unavailable — send directly (dev fallback)
    await getEmailProvider().sendEmail(sendable);
  }
}

const DEFAULT_HTML_TEMPLATES: Record<string, string> = {
  WELCOME_EMAIL: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #A10E4D;">Welcome to Vivah Australia, {{ firstName }}!</h1>
      <p>We're so glad you're here. Take a few minutes to complete your profile and start connecting with genuine people looking for a serious relationship.</p>
    </div>
  `,
  OTP_VERIFICATION: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #A10E4D;">Verify Your Email</h2>
      <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 2px;">{{ otp }}</strong></p>
      <p>This code will expire in 10 minutes.</p>
    </div>
  `,
  MATCH_NOTIFICATION: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #A10E4D;">Someone has shown interest in you!</h2>
      <p>You have a new interest on your profile. Log in to see who it is and decide if you'd like to connect.</p>
      <a href="{{ link }}" style="display: inline-block; background-color: #A10E4D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Your Match</a>
    </div>
  `,
  NOTIFICATION_NEW_MESSAGE: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #A10E4D;">You have a new message</h2>
      <p>A member has sent you a new message on Vivah Australia.</p>
      <a href="{{ messageUrl }}" style="display: inline-block; background-color: #A10E4D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Open messages</a>
    </div>
  `,
  NOTIFICATION_INTEREST_RECEIVED: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #A10E4D;">You have a new interest</h2>
      <p>Someone has shown interest in your profile on Vivah Australia.</p>
      <a href="{{ actionUrl }}" style="display: inline-block; background-color: #A10E4D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Review interest</a>
    </div>
  `,
  NOTIFICATION_INTEREST_ACCEPTED: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #A10E4D;">Your interest was accepted</h2>
      <p>Great news. You can now start a conversation on Vivah Australia.</p>
      <a href="{{ actionUrl }}" style="display: inline-block; background-color: #A10E4D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Open messages</a>
    </div>
  `,
  ONBOARDING_DRIP_DAY_0: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #A10E4D;">Welcome to Vivah Australia</h2>
      <p>Hi {{ firstName }}, complete your profile so serious matches can get a real sense of you.</p>
      <a href="{{ actionUrl }}" style="display: inline-block; background-color: #A10E4D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Complete profile</a>
    </div>
  `,
  ONBOARDING_DRIP_DAY_3: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #A10E4D;">Add the details members look for first</h2>
      <p>A clear photo, thoughtful profile text, and your core details make a big difference.</p>
      <a href="{{ actionUrl }}" style="display: inline-block; background-color: #A10E4D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Update profile</a>
    </div>
  `,
  ONBOARDING_DRIP_DAY_7: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #A10E4D;">Start exploring your matches</h2>
      <p>Browse recommended profiles and send thoughtful interests to members you genuinely connect with.</p>
      <a href="{{ actionUrl }}" style="display: inline-block; background-color: #A10E4D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Discover matches</a>
    </div>
  `,
  ONBOARDING_DRIP_DAY_10: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #A10E4D;">Build trust with verification</h2>
      <p>Verified members tend to get more attention and stronger replies. A few quick steps can help your profile stand out.</p>
      <a href="{{ actionUrl }}" style="display: inline-block; background-color: #A10E4D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View verification</a>
    </div>
  `,
  ONBOARDING_DRIP_DAY_14: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #A10E4D;">Keep your momentum going</h2>
      <p>Consistent activity, profile strength, and thoughtful outreach help you get the most from Vivah Australia.</p>
      <a href="{{ actionUrl }}" style="display: inline-block; background-color: #A10E4D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">See your dashboard</a>
    </div>
  `,
};

export async function sendTemplatedEmail(input: TemplatedEmail): Promise<void> {
  const template = await loadEmailTemplate(input.templateKey);
  const subjectSource = template?.subject?.trim() || input.subjectFallback;
  const htmlSource =
    template?.body?.trim() || DEFAULT_HTML_TEMPLATES[input.templateKey] || input.htmlFallback || input.textFallback || input.subjectFallback;
  const renderedSubject = renderTemplateString(subjectSource, input.context);
  const renderedHtml = renderTemplateString(htmlSource, input.context, { html: true });
  const renderedText = input.textFallback
    ? renderTemplateString(input.textFallback, input.context)
    : stripHtmlTags(renderedHtml);

  await sendEmail({
    to: input.to,
    ...(input.from ? { from: input.from } : {}),
    subject: renderedSubject,
    html: renderedHtml,
    text: renderedText,
    ...(input.isMarketing ? { isMarketing: true } : {}),
    ...(input.recipientUserId ? { recipientUserId: input.recipientUserId } : {}),
  });
}
