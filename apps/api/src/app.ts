import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { createAuthRouter } from './auth/auth.routes.js';
import { isHttpError } from './auth/auth-errors.js';
import type { AuthConfig } from './auth/auth-types.js';
import { createInteractionsRouter } from './interactions/interactions.routes.js';
import { createMatchRouter } from './match/match.routes.js';
import { createMediaRouter } from './media/media.routes.js';
import { createMessagesRouter } from './messages/messages.routes.js';
import { createPublicRouter } from './public/public.routes.js';
import { createProfileRouter } from './profile/profile.routes.js';

function isZodValidationError(error: unknown): error is z.ZodError {
  return (
    error instanceof z.ZodError ||
    (typeof error === 'object' &&
      error !== null &&
      'issues' in error &&
      Array.isArray((error as { issues?: unknown }).issues))
  );
}

export interface CreateAppOptions {
  corsOrigins: string[];
  auth: AuthConfig;
}

export function createApp(options: CreateAppOptions): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
        if (!origin || options.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Origin is not allowed by CORS'));
      },
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_request: Request, response: Response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRouter(options.auth));
  app.use('/api', createPublicRouter(options.auth));
  app.use('/api', createProfileRouter(options.auth));
  app.use('/api', createMediaRouter(options.auth));
  app.use('/api', createMatchRouter(options.auth));
  app.use('/api', createInteractionsRouter(options.auth));
  app.use('/api', createMessagesRouter(options.auth));

  app.use((error: unknown, _request: Request, response: Response, _next: express.NextFunction) => {
    if (isZodValidationError(error)) {
      response.status(400).json({ message: 'Validation failed', issues: error.issues });
      return;
    }

    if (isHttpError(error)) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }

    if (process.env.NODE_ENV !== 'test') {
      console.error(error);
    }

    response.status(500).json({ message: 'Internal server error' });
  });

  return app;
}
