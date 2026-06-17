import twilio from 'twilio';
import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { logger } from './logger.js';
import { redisClient } from './redis.js';

const redisConnection = redisClient;
const queueConnection = redisConnection as ConnectionOptions | null;

let twilioClient: twilio.Twilio | null = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export interface SmsJobData {
  to: string;
  body: string;
}

export const smsQueue = queueConnection
  ? new Queue<SmsJobData>('smsQueue', { connection: queueConnection })
  : null;

const smsWorker = queueConnection
  ? new Worker<SmsJobData>('smsQueue', async (job) => {
      if (!twilioClient || !process.env.TWILIO_FROM_NUMBER) {
        logger.warn('Twilio not configured, skipping SMS send to ' + job.data.to);
        return;
      }
      await twilioClient.messages.create({
        body: job.data.body,
        from: process.env.TWILIO_FROM_NUMBER,
        to: job.data.to,
      });
    }, { connection: queueConnection })
  : null;

smsWorker?.on('failed', (job, err) => {
  logger.error({ err, jobId: job?.id }, 'SMS job failed');
});

export async function sendSms(input: { to: string; message: string }) {
  if (smsQueue) {
    await smsQueue.add('send', { to: input.to, body: input.message }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  } else {
    logger.warn('Redis unavailable — SMS not queued, skipping send to ' + input.to);
  }
}
