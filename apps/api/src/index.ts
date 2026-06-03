import { createServer } from 'node:http';
import { createApp } from './app.js';
import { reportApplicationError } from './common/error-tracking.service.js';
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

  if (process.env.NODE_ENV !== 'test') {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        source,
        message,
        stack,
      }),
    );
  }

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
    console.log(`API listening on ${env.API_BASE_URL}`);
  });
}

try {
  await startServer();
} catch (error) {
  await reportProcessError('startup', error);
  process.exit(1);
}
