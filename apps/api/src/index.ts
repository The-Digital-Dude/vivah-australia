import { createServer } from 'node:http';
import { createApp } from './app.js';
import { reportApplicationError } from './common/error-tracking.service.js';
import { logger } from './common/logger.js';
import { connectDatabase } from './db/connection.js';
import { env } from './env.js';
import { attachMessageSocketServer } from './messages/messages.socket.js';
import { onboardingDripQueue } from './notifications/onboarding-drip.worker.js';
import { weeklyDigestQueue } from './notifications/weekly-digest.worker.js';
import { subscriptionExpiryQueue } from './billing/subscription-expiry.worker.js';
import { matchCachingQueue, savedSearchNotifyQueue } from './match/match.worker.js';
import { profileCompletionNudgeQueue } from './profile/profile-completion.worker.js';

const authConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  exposeSensitiveTokens: env.NODE_ENV !== 'production',
};

async function reportProcessError(
  source: 'startup' | 'uncaughtException' | 'unhandledRejection',
  error: unknown,
) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  logger.error({ source, err: error instanceof Error ? error : new Error(message), stack }, `Process error: ${source}`);

  await reportApplicationError({
    source,
    message,
    ...(stack ? { stack } : {}),
  });
}

process.on('uncaughtException', (error) => {
  void reportProcessError('uncaughtException', error).finally(() => {
    process.exitCode = 1;
  });
});

process.on('unhandledRejection', (reason) => {
  void reportProcessError('unhandledRejection', reason).finally(() => {
    process.exitCode = 1;
  });
});

async function startServer() {
  const corsOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());

  if (env.NODE_ENV === 'production') {
    if (corsOrigins.includes('*')) {
      throw new Error('CORS_ORIGINS must not contain * in production');
    }
    const insecure = corsOrigins.filter((o) => !o.startsWith('https://'));
    if (insecure.length > 0) {
      throw new Error(`Non-HTTPS CORS origins are not allowed in production: ${insecure.join(', ')}`);
    }
  }

  const app = createApp({
    corsOrigins,
    auth: authConfig,
  });

  await connectDatabase(env.MONGODB_URI);

  const server = createServer(app);
  attachMessageSocketServer(server, {
    corsOrigins,
    auth: authConfig,
  });

  server.listen(env.API_PORT, () => {
    logger.info({ url: env.API_BASE_URL, port: env.API_PORT }, 'API server started');
  });

  // Schedule nightly match pre-caching (skipped if Redis unavailable)
  if (matchCachingQueue) {
    await matchCachingQueue.add('precalculate-matches', {}, {
      repeat: { pattern: '0 2 * * *' },
    });
  } else {
    logger.warn('Redis not available — match pre-caching disabled');
  }

  // Schedule daily saved search notifications
  if (savedSearchNotifyQueue) {
    await savedSearchNotifyQueue.add('notify-saved-searches', {}, {
      repeat: { pattern: '0 8 * * *' }, // 8 AM everyday
    });
  } else {
    logger.warn('Redis not available — saved search notifications disabled');
  }

  if (profileCompletionNudgeQueue) {
    await profileCompletionNudgeQueue.add('send-profile-completion-nudges', {}, {
      repeat: { pattern: '0 9 * * *' },
    });
  } else {
    logger.warn('Redis not available — profile completion nudges disabled');
  }

  if (onboardingDripQueue) {
    await onboardingDripQueue.add('send-onboarding-drip', {}, {
      repeat: { pattern: '0 10 * * *' },
    });
  } else {
    logger.warn('Redis not available — onboarding drip disabled');
  }

  if (weeklyDigestQueue) {
    await weeklyDigestQueue.add('send-weekly-digest', {}, {
      repeat: { pattern: '0 11 * * 1' },
    });
  } else {
    logger.warn('Redis not available — weekly digest disabled');
  }

  if (subscriptionExpiryQueue) {
    await subscriptionExpiryQueue.add('revoke-expired-subscriptions', {}, {
      repeat: { pattern: '0 1 * * *' },
    });
  } else {
    logger.warn('Redis not available — subscription expiry safety net disabled');
  }
}

try {
  await startServer();
} catch (error) {
  await reportProcessError('startup', error);
  process.exit(1);
}
