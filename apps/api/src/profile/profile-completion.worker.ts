import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { redisClient } from '../common/redis.js';
import { sendProfileCompletionNudges } from './profile.service.js';

const redisConnection = redisClient;
const queueConnection = redisConnection as ConnectionOptions | null;

export const profileCompletionNudgeQueue = queueConnection
  ? new Queue('profileCompletionNudgeQueue', { connection: queueConnection })
  : null;

export const profileCompletionNudgeWorker = queueConnection
  ? new Worker(
      'profileCompletionNudgeQueue',
      async () => {
        await sendProfileCompletionNudges();
      },
      { connection: queueConnection },
    )
  : null;

profileCompletionNudgeWorker?.on('failed', (job, err) => {
  console.error(`Profile completion nudge job ${job?.id} failed:`, err);
});
