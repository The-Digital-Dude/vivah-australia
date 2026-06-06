import { TemplateModel } from '../models/index.js';
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
}

type RenderValue = string | number | boolean | null | undefined;

let queueTail = Promise.resolve();

function enqueueEmailSend(task: () => Promise<void>): Promise<void> {
  const next = queueTail.then(task, task);
  queueTail = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

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
  const emailProvider = getEmailProvider();
  await enqueueEmailSend(() => emailProvider.sendEmail(email));
}

export async function sendTemplatedEmail(input: TemplatedEmail): Promise<void> {
  const template = await loadEmailTemplate(input.templateKey);
  const subjectSource = template?.subject?.trim() || input.subjectFallback;
  const htmlSource =
    template?.body?.trim() || input.htmlFallback || input.textFallback || input.subjectFallback;
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
  });
}
