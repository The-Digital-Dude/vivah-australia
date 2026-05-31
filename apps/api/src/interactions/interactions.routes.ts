import {
  interestListQuerySchema,
  interestRespondSchema,
  profileTargetSchema,
  reportAdminReviewSchema,
  reportCreateSchema,
  reportStatusSchema,
  UserRole,
} from '@vivah/shared';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { HttpError } from '../auth/auth-errors.js';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import {
  addFavourite,
  blockProfile,
  createReport,
  listBlocks,
  listFavourites,
  listInterests,
  listReports,
  removeFavourite,
  respondToInterest,
  reviewReport,
  sendInterest,
  unblockProfile,
} from './interactions.service.js';

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

function requireAdmin(request: AuthenticatedRequest) {
  const auth = requireRequestAuth(request);
  if (
    auth.role !== UserRole.ADMIN &&
    auth.role !== UserRole.SUPER_ADMIN &&
    auth.role !== UserRole.MODERATOR
  ) {
    throw new HttpError(403, 'Admin access required');
  }
  return auth;
}

export function createInteractionsRouter(config: AuthConfig): Router {
  const router = Router();

  router.get(
    '/me/interests',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = interestListQuerySchema.parse(request.query);
      const interests = await listInterests(auth.userId, input.box);
      response.status(200).json({ interests });
    }),
  );

  router.post(
    '/interests',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = profileTargetSchema.parse(request.body);
      const interest = await sendInterest(auth.userId, input.profileId);
      response.status(201).json({ interest, message: 'Interest sent' });
    }),
  );

  router.patch(
    '/interests/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = interestRespondSchema.parse(request.body);
      const interestId = request.params.id;

      if (!interestId) {
        throw new HttpError(404, 'Interest not found');
      }

      const interest = await respondToInterest(auth.userId, interestId, input.action);
      response.status(200).json({ interest, message: 'Interest updated' });
    }),
  );

  router.get(
    '/me/favourites',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const favourites = await listFavourites(auth.userId);
      response.status(200).json({ favourites });
    }),
  );

  router.post(
    '/me/favourites',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = profileTargetSchema.parse(request.body);
      const favourite = await addFavourite(auth.userId, input.profileId);
      response.status(201).json({ favourite, message: 'Profile saved' });
    }),
  );

  router.delete(
    '/me/favourites/:profileId',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const profileId = request.params.profileId;

      if (!profileId) {
        throw new HttpError(404, 'Profile not found');
      }

      await removeFavourite(auth.userId, profileId);
      response.status(204).send();
    }),
  );

  router.get(
    '/me/blocks',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const blocks = await listBlocks(auth.userId);
      response.status(200).json({ blocks });
    }),
  );

  router.post(
    '/me/blocks',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = profileTargetSchema.parse(request.body);
      const block = await blockProfile(auth.userId, input.profileId);
      response.status(201).json({ block, message: 'Member blocked' });
    }),
  );

  router.delete(
    '/me/blocks/:profileId',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const profileId = request.params.profileId;

      if (!profileId) {
        throw new HttpError(404, 'Profile not found');
      }

      await unblockProfile(auth.userId, profileId);
      response.status(204).send();
    }),
  );

  router.post(
    '/reports',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = reportCreateSchema.parse(request.body);
      const report = await createReport(auth.userId, {
        targetType: input.targetType,
        reason: input.reason,
        severity: input.severity,
        ...(input.targetId ? { targetId: input.targetId } : {}),
        ...(input.profileId ? { profileId: input.profileId } : {}),
      });
      response.status(201).json({ report, message: 'Report submitted' });
    }),
  );

  router.get(
    '/admin/reports',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdmin(request);
      const status = reportStatusSchema.parse(request.query.status ?? 'OPEN');
      const reports = await listReports(status);
      response.status(200).json({ reports });
    }),
  );

  router.patch(
    '/admin/reports/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireAdmin(request);
      const reportId = request.params.id;

      if (!reportId) {
        throw new HttpError(404, 'Report not found');
      }

      const input = reportAdminReviewSchema.parse(request.body);
      const report = await reviewReport(auth.userId, reportId, input.action);
      response.status(200).json({ report, message: 'Report updated' });
    }),
  );

  return router;
}
