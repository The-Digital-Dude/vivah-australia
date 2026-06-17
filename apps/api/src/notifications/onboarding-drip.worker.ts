import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { redisClient } from '../common/redis.js';
import { sendNewMemberDripEmails } from './onboarding-drip.service.js';

const redisConnection = redisClient;
const queueConnection = redisConnection as ConnectionOptions | null;

export const onboardingDripQueue = queueConnection
  ? new Queue('onboardingDripQueue', { connection: queueConnection })
  : null;

export const onboardingDripWorker = queueConnection
  ? new Worker(
      'onboardingDripQueue',
      async () => {
        await sendNewMemberDripEmails();
      },
      { connection: queueConnection },
    )
  : null;

onboardingDripWorker?.on('failed', (job, err) => {
  console.error(`Onboarding drip job ${job?.id} failed:`, err);
});
