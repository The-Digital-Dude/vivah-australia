import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { redisClient } from '../common/redis.js';
import { sendWeeklyActivityDigests } from './weekly-digest.service.js';

const redisConnection = redisClient;
const queueConnection = redisConnection as ConnectionOptions | null;

export const weeklyDigestQueue = queueConnection
  ? new Queue('weeklyDigestQueue', { connection: queueConnection })
  : null;

export const weeklyDigestWorker = queueConnection
  ? new Worker(
      'weeklyDigestQueue',
      async () => {
        await sendWeeklyActivityDigests();
      },
      { connection: queueConnection },
    )
  : null;

weeklyDigestWorker?.on('failed', (job, err) => {
  console.error(`Weekly digest job ${job?.id} failed:`, err);
});
