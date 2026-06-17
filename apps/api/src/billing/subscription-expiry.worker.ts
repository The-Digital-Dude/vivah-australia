import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { redisClient } from '../common/redis.js';
import { revokeExpiredSubscriptions } from './billing.service.js';

const redisConnection = redisClient;
const queueConnection = redisConnection as ConnectionOptions | null;

export const subscriptionExpiryQueue = queueConnection
  ? new Queue('subscriptionExpiryQueue', { connection: queueConnection })
  : null;

export const subscriptionExpiryWorker = queueConnection
  ? new Worker(
      'subscriptionExpiryQueue',
      async () => {
        await revokeExpiredSubscriptions();
      },
      { connection: queueConnection },
    )
  : null;

subscriptionExpiryWorker?.on('failed', (job, err) => {
  console.error(`Subscription expiry job ${job?.id} failed:`, err);
});
