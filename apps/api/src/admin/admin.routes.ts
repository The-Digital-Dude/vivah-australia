import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  adminUserQuerySchema,
  adminUserUpdateSchema,
  profileModerationQuerySchema,
  profileModerationReviewSchema,
  verificationRequestCreateSchema,
  verificationReviewSchema,
  VerificationStatus,
  verificationStatusSchema,
} from '@vivah/shared';
import { requireAdmin, requireAuth, requireRoles } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { HttpError } from '../auth/auth-errors.js';
import {
  createVerificationRequest,
  getDashboardSummary,
  listOwnVerificationRequests,
  listProfilesForModeration,
  listUsers,
  listVerificationRequests,
  reviewProfile,
  reviewVerificationRequest,
  updateUser,
} from './admin.service.js';

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

export function createAdminRouter(config: AuthConfig): Router {
  const router = Router();

  router.get(
    '/admin/dashboard/summary',
    requireAuth(config),
    requireAdmin,
    asyncHandler(async (_request, response) => {
      response.status(200).json(await getDashboardSummary());
    }),
  );

  router.get(
    '/admin/users',
    requireAuth(config),
    requireAdmin,
    asyncHandler(async (request, response) => {
      response.status(200).json(await listUsers(adminUserQuerySchema.parse(request.query)));
    }),
  );

  router.patch(
    '/admin/users/:id',
    requireAuth(config),
    requireRoles(['SUPER_ADMIN', 'ADMIN']),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const userId = request.params.id;
      if (!userId) throw new HttpError(404, 'User not found');
      response.status(200).json({
        user: await updateUser(auth.userId, userId, adminUserUpdateSchema.parse(request.body)),
      });
    }),
  );

  router.get(
    '/admin/profiles',
    requireAuth(config),
    requireAdmin,
    asyncHandler(async (request, response) => {
      const input = profileModerationQuerySchema.parse(request.query);
      response.status(200).json({ profiles: await listProfilesForModeration(input.status) });
    }),
  );

  router.patch(
    '/admin/profiles/:id/review',
    requireAuth(config),
    requireAdmin,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = profileModerationReviewSchema.parse(request.body);
      const profileId = request.params.id;
      if (!profileId) throw new HttpError(404, 'Profile not found');
      response.status(200).json({
        profile: await reviewProfile(auth.userId, profileId, input),
        message: 'Profile reviewed',
      });
    }),
  );

  router.post(
    '/me/verifications',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = verificationRequestCreateSchema.parse(request.body);
      response.status(201).json({
        request: await createVerificationRequest(auth.userId, input),
        message: 'Verification request submitted',
      });
    }),
  );

  router.get(
    '/me/verifications',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json({ requests: await listOwnVerificationRequests(auth.userId) });
    }),
  );

  router.get(
    '/admin/verifications',
    requireAuth(config),
    requireAdmin,
    asyncHandler(async (request, response) => {
      const status =
        typeof request.query.status === 'string'
          ? verificationStatusSchema.parse(request.query.status)
          : VerificationStatus.PENDING;
      response.status(200).json({ requests: await listVerificationRequests(status) });
    }),
  );

  router.patch(
    '/admin/verifications/:id/review',
    requireAuth(config),
    requireAdmin,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = verificationReviewSchema.parse(request.body);
      const requestId = request.params.id;
      if (!requestId) throw new HttpError(404, 'Verification request not found');
      response.status(200).json({
        request: await reviewVerificationRequest(auth.userId, requestId, input),
        message: 'Verification reviewed',
      });
    }),
  );

  return router;
}
