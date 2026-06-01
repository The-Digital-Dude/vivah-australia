import { Router, type NextFunction, type Request, type Response } from 'express';
import { notificationListQuerySchema } from '@vivah/shared';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { HttpError } from '../auth/auth-errors.js';
import { listNotifications, markNotificationRead } from './notifications.service.js';

function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function requireRequestAuth(request: AuthenticatedRequest) {
  if (!request.auth) {
    throw new HttpError(401, 'Authentication required');
  }
  return request.auth;
}

export function createNotificationsRouter(config: AuthConfig): Router {
  const router = Router();

  router.get(
    '/me/notifications',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = notificationListQuerySchema.parse(request.query);
      response.status(200).json({
        notifications: await listNotifications(auth.userId, input.unreadOnly),
      });
    }),
  );

  router.patch(
    '/me/notifications/:id/read',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const notificationId = request.params.id;
      if (!notificationId) throw new HttpError(404, 'Notification not found');
      const notification = await markNotificationRead(auth.userId, notificationId);
      response.status(200).json({ notification });
    }),
  );

  return router;
}
