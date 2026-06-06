import cors from 'cors';
import crypto from 'crypto';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { createAdminRouter } from './admin/admin.routes.js';
import { createAuthRouter } from './auth/auth.routes.js';
import { isHttpError } from './auth/auth-errors.js';
import type { AuthConfig } from './auth/auth-types.js';
import { createBillingRouter, createStripeWebhookRouter } from './billing/billing.routes.js';
import { createCommunityRouter } from './community/community.routes.js';
import { createInteractionsRouter } from './interactions/interactions.routes.js';
import { createPhotoRequestsRouter } from './interactions/photo-requests.routes.js';
import { createMatchRouter } from './match/match.routes.js';
import { createMediaRouter } from './media/media.routes.js';
import { createMessagesRouter } from './messages/messages.routes.js';
import { createNotificationsRouter } from './notifications/notifications.routes.js';
import { createPublicRouter } from './public/public.routes.js';
import { createProfileRouter } from './profile/profile.routes.js';
import { reportApplicationError } from './common/error-tracking.service.js';
import { logger } from './common/logger.js';

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

  // Request ID / Correlation ID Middleware
  app.use((request: Request, response: Response, next: express.NextFunction) => {
    const reqId = request.header('x-request-id') || crypto.randomUUID();
    request.headers['x-request-id'] = reqId;
    response.setHeader('x-request-id', reqId);
    next();
  });

  // Structured HTTP Request Logging (pino child logger per request)
  app.use((request: Request, response: Response, next: express.NextFunction) => {
    const isHealthCheck = request.url === '/health' || request.url === '/api/health';
    const startTime = Date.now();
    const reqLog = logger.child({
      requestId: request.headers['x-request-id'],
      method: request.method,
      url: request.url,
    });

    response.on('finish', () => {
      if (isHealthCheck) return; // suppress health-check noise
      const durationMs = Date.now() - startTime;
      const statusCode = response.statusCode;
      const logData = { statusCode, durationMs };
      if (statusCode >= 500) {
        reqLog.error(logData, 'HTTP request completed');
      } else if (statusCode >= 400) {
        reqLog.warn(logData, 'HTTP request completed');
      } else {
        reqLog.info(logData, 'HTTP request completed');
      }
    });

    next();
  });

  app.use('/api', createStripeWebhookRouter());
  app.use(express.json({ limit: '1mb' }));

  const healthHandler = (_request: Request, response: Response) => {
    response.status(200).json({ status: 'ok' });
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  app.use('/api/auth', createAuthRouter(options.auth));
  app.use('/api', createPublicRouter(options.auth));
  app.use('/api', createProfileRouter(options.auth));
  app.use('/api', createMediaRouter(options.auth));
  app.use('/api', createMatchRouter(options.auth));
  app.use('/api', createInteractionsRouter(options.auth));
  app.use('/api', createPhotoRequestsRouter(options.auth));
  app.use('/api', createMessagesRouter(options.auth));
  app.use('/api', createCommunityRouter(options.auth));
  app.use('/api', createBillingRouter(options.auth));
  app.use('/api', createAdminRouter(options.auth));
  app.use('/api', createNotificationsRouter(options.auth));

  app.use((error: unknown, request: Request, response: Response, _next: express.NextFunction) => {
    const reqId = response.getHeader('x-request-id') || request.headers['x-request-id'];

    if (isZodValidationError(error)) {
      response.status(400).json({ message: 'Validation failed', issues: error.issues });
      return;
    }

    if (isHttpError(error)) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }

    logger.error({
      requestId: reqId,
      err: error instanceof Error ? error : new Error(String(error)),
    }, 'Unhandled request error');

    void reportApplicationError({
      source: 'express',
      ...(typeof reqId === 'string' ? { requestId: reqId } : {}),
      method: request.method,
      url: request.originalUrl,
      statusCode: 500,
      message: error instanceof Error ? error.message : String(error),
      ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
    });

    response.status(500).json({ message: 'Internal server error', requestId: reqId });
  });

  return app;
}
