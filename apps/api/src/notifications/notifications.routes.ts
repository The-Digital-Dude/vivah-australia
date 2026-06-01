import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  mobileOtpRequestSchema,
  mobileOtpVerifySchema,
  notificationListQuerySchema,
  pushSubscriptionSchema,
} from '@vivah/shared';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { HttpError } from '../auth/auth-errors.js';
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  requestMobileOtp,
  savePushSubscription,
  sendTestPush,
  verifyMobileOtp,
  unreadNotificationCount,
} from './notifications.service.js';

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
        unreadCount: await unreadNotificationCount(auth.userId),
      });
    }),
  );

  router.post(
    '/me/mobile/request-otp',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = mobileOtpRequestSchema.parse(request.body);
      response.status(201).json(await requestMobileOtp(auth.userId, input.mobile));
    }),
  );

  router.post(
    '/me/mobile/verify-otp',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = mobileOtpVerifySchema.parse(request.body);
      response.status(200).json(await verifyMobileOtp(auth.userId, input.mobile, input.code));
    }),
  );

  router.post(
    '/me/push-subscriptions',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = pushSubscriptionSchema.parse(request.body);
      response.status(201).json({ subscription: await savePushSubscription(auth.userId, input) });
    }),
  );

  router.post(
    '/me/push/test',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      await sendTestPush(auth.userId);
      response.status(200).json({ message: 'Push test queued.' });
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

  router.patch(
    '/me/notifications/read-all',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json({ updated: await markAllNotificationsRead(auth.userId) });
    }),
  );

  router.delete(
    '/me/notifications/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const notificationId = request.params.id;
      if (!notificationId) throw new HttpError(404, 'Notification not found');
      const notification = await deleteNotification(auth.userId, notificationId);
      if (!notification) throw new HttpError(404, 'Notification not found');
      response.status(200).json({ message: 'Notification deleted' });
    }),
  );

  return router;
}
