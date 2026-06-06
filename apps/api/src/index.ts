import { createServer } from 'node:http';
import { createApp } from './app.js';
import { reportApplicationError } from './common/error-tracking.service.js';
import { logger } from './common/logger.js';
import { connectDatabase } from './db/connection.js';
import { env } from './env.js';
import { attachMessageSocketServer } from './messages/messages.socket.js';

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
}

try {
  await startServer();
} catch (error) {
  await reportProcessError('startup', error);
  process.exit(1);
}
