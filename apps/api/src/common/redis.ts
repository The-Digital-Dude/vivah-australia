import { Redis } from 'ioredis';
import { env } from '../env.js';

async function tryCreateRedis(): Promise<Redis | null> {
  let client: Redis | null = null;
  try {
    client = new Redis(env.REDIS_URI, { maxRetriesPerRequest: null });
    const info = await client.info('server');
    const match = /redis_version:(\d+)\./.exec(info);
    const major = match ? parseInt(match[1]!, 10) : 0;
    if (major < 5) {
      console.warn(`[redis] Redis ${major}.x detected — BullMQ requires 5+. Queues disabled.`);
      await client.quit();
      return null;
    }
    return client;
  } catch (err) {
    if (client) await client.quit().catch(() => {});
    if (env.NODE_ENV === 'production') throw err;
    console.warn('[redis] Could not connect to Redis — queues disabled:', (err as Error).message);
    return null;
  }
}

export const redisClient = await tryCreateRedis();
