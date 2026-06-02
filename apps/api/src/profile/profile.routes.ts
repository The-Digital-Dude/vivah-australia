import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  accountSettingsSchema,
  notificationPreferencesSchema,
  profileDraftSchema,
  profileSubmitSchema,
} from '@vivah/shared';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { HttpError } from '../auth/auth-errors.js';
import {
  getOwnProfile,
  listRecentlyViewedProfiles,
  getVisibleProfile,
  submitOwnProfile,
  updateAccountSettings,
  updateNotificationPreferences,
  updateOwnProfile,
} from './profile.service.js';

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

export function createProfileRouter(config: AuthConfig): Router {
  const router = Router();

  router.get(
    '/me/profile',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const profile = await getOwnProfile(auth.userId);
      response.status(200).json({ profile });
    }),
  );

  router.patch(
    '/me/profile',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = profileDraftSchema.parse(request.body);
      const profile = await updateOwnProfile(auth.userId, input);
      response.status(200).json({ profile });
    }),
  );

  router.post(
    '/me/profile/submit',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      profileSubmitSchema.parse(request.body);
      const profile = await submitOwnProfile(auth.userId);
      response.status(200).json({ profile });
    }),
  );

  router.patch(
    '/me/privacy',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = profileDraftSchema.pick({ visibility: true }).parse(request.body);
      const profile = await updateOwnProfile(auth.userId, input);
      response.status(200).json({ profile });
    }),
  );

  router.patch(
    '/me/notification-preferences',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const preferences = notificationPreferencesSchema.parse(request.body);
      response
        .status(200)
        .json({ preferences: await updateNotificationPreferences(auth.userId, preferences) });
    }),
  );

  router.patch(
    '/me/account',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = accountSettingsSchema.parse(request.body);
      const user = await updateAccountSettings(auth.userId, input.marketingConsent);
      response.status(200).json({ user: { id: user.id, marketingConsent: user.marketingConsent } });
    }),
  );

  router.post('/me/deactivate', requireAuth(config), (_request: AuthenticatedRequest, response) => {
    response.status(202).json({ message: 'Deactivate request accepted.' });
  });

  router.post(
    '/me/delete-request',
    requireAuth(config),
    (_request: AuthenticatedRequest, response) => {
      response.status(202).json({ message: 'Delete request accepted.' });
    },
  );

  router.get(
    '/me/recently-viewed',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json({ items: await listRecentlyViewedProfiles(auth.userId) });
    }),
  );

  router.get(
    '/profiles/:id',
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const header = request.header('authorization');
      let viewerId = request.auth?.userId;

      if (!viewerId && header?.startsWith('Bearer ')) {
        await new Promise<void>((resolve, reject) => {
          requireAuth(config)(request, response, (error?: unknown) => {
            if (error) {
              reject(error instanceof Error ? error : new Error('Authentication failed'));
              return;
            }

            viewerId = request.auth?.userId;
            resolve();
          });
        });
      }

      const profileId = request.params.id;

      if (!profileId) {
        throw new HttpError(404, 'Profile not found');
      }

      const profile = await getVisibleProfile(profileId, viewerId);
      response.status(200).json({ profile });
    }),
  );

  return router;
}
