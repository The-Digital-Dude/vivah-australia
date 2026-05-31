import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  mediaCompleteUploadSchema,
  mediaReviewSchema,
  mediaSignUploadSchema,
  mediaUpdateSchema,
  UserRole,
} from '@vivah/shared';
import { requireAuth } from '../auth/auth.middleware.js';
import { HttpError } from '../auth/auth-errors.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import {
  completeMediaUpload,
  createMediaAccess,
  createSignedMediaUpload,
  deleteOwnMedia,
  listMediaForReview,
  listOwnMedia,
  reviewMedia,
  updateOwnMedia,
} from './media.service.js';

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

function requireAdminRole(request: AuthenticatedRequest) {
  const role = request.auth?.role;

  if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN && role !== UserRole.MODERATOR) {
    throw new HttpError(403, 'Admin access required');
  }
}

export function createMediaRouter(config: AuthConfig): Router {
  const router = Router();

  router.post(
    '/me/media/sign-upload',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = mediaSignUploadSchema.parse(request.body);
      const result = await createSignedMediaUpload(auth.userId, input);
      response.status(201).json(result);
    }),
  );

  router.post(
    '/me/media/complete',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = mediaCompleteUploadSchema.parse(request.body);
      const media = await completeMediaUpload(auth.userId, input);
      response.status(200).json({ media });
    }),
  );

  router.get(
    '/me/media',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const media = await listOwnMedia(auth.userId);
      response.status(200).json({ media });
    }),
  );

  router.patch(
    '/me/media/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const mediaId = request.params.id;

      if (!mediaId) {
        throw new HttpError(404, 'Media not found');
      }

      const input = mediaUpdateSchema.parse(request.body);
      const media = await updateOwnMedia(auth.userId, mediaId, input);
      response.status(200).json({ media });
    }),
  );

  router.delete(
    '/me/media/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const mediaId = request.params.id;

      if (!mediaId) {
        throw new HttpError(404, 'Media not found');
      }

      await deleteOwnMedia(auth.userId, mediaId);
      response.status(204).send();
    }),
  );

  router.get(
    '/me/media/:id/access',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const mediaId = request.params.id;

      if (!mediaId) {
        throw new HttpError(404, 'Media not found');
      }

      const result = await createMediaAccess(auth.userId, mediaId);
      response.status(200).json(result);
    }),
  );

  router.get(
    '/admin/media',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireRequestAuth(request);
      requireAdminRole(request);
      const status = typeof request.query.status === 'string' ? request.query.status : undefined;
      const media = await listMediaForReview(status);
      response.status(200).json({ media });
    }),
  );

  router.patch(
    '/admin/media/:id/review',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      requireAdminRole(request);
      const mediaId = request.params.id;

      if (!mediaId) {
        throw new HttpError(404, 'Media not found');
      }

      const input = mediaReviewSchema.parse(request.body);
      const media = await reviewMedia(auth.userId, mediaId, input);
      response.status(200).json({ media });
    }),
  );

  return router;
}
