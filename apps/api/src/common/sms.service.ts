import twilio from 'twilio';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../env.js';
import { logger } from './logger.js';

const redisConnection = new Redis(env.REDIS_URI, {
  maxRetriesPerRequest: null,
});

let twilioClient: twilio.Twilio | null = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export interface SmsJobData {
  to: string;
  body: string;
}

export const smsQueue = new Queue<SmsJobData>('smsQueue', { connection: redisConnection as any });

export const smsWorker = new Worker<SmsJobData>('smsQueue', async (job) => {
  if (!twilioClient || !process.env.TWILIO_FROM_NUMBER) {
    logger.warn('Twilio not configured, skipping SMS send to ' + job.data.to);
    return;
  }
  
  await twilioClient.messages.create({
    body: job.data.body,
    from: process.env.TWILIO_FROM_NUMBER,
    to: job.data.to,
  });
}, { connection: redisConnection as any });

smsWorker.on('failed', (job, err) => {
  logger.error({ err, jobId: job?.id }, 'SMS job failed');
});

export async function sendSms(to: string, body: string) {
  await smsQueue.add('send', { to, body }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}
