import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  auditLogQuerySchema,
  adminUserQuerySchema,
  adminUserNoteSchema,
  adminUserRoleUpdateSchema,
  adminUserStatusUpdateSchema,
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
  addUserNote,
  getDashboardSummary,
  getOwnVerificationRequest,
  getProfileModerationDetail,
  getUserDetail,
  getVerificationRequestDetail,
  listAuditLogs,
  listOwnVerificationRequests,
  listProfilesForModeration,
  listUsers,
  listVerificationRequests,
  reviewProfile,
  reviewVerificationRequest,
  updateUserRole,
  updateUserStatus,
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
        user: await updateUser(
          auth.userId,
          auth.role,
          userId,
          adminUserUpdateSchema.parse(request.body),
        ),
      });
    }),
  );

  router.get(
    '/admin/users/:id',
    requireAuth(config),
    requireAdmin,
    asyncHandler(async (request, response) => {
      const userId = request.params.id;
      if (!userId) throw new HttpError(404, 'User not found');
      response.status(200).json(await getUserDetail(userId));
    }),
  );

  router.patch(
    '/admin/users/:id/status',
    requireAuth(config),
    requireRoles(['SUPER_ADMIN', 'ADMIN']),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const userId = request.params.id;
      if (!userId) throw new HttpError(404, 'User not found');
      response.status(200).json({
        user: await updateUserStatus(
          auth.userId,
          auth.role,
          userId,
          adminUserStatusUpdateSchema.parse(request.body),
        ),
      });
    }),
  );

  router.patch(
    '/admin/users/:id/role',
    requireAuth(config),
    requireRoles(['SUPER_ADMIN', 'ADMIN']),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const userId = request.params.id;
      if (!userId) throw new HttpError(404, 'User not found');
      response.status(200).json({
        user: await updateUserRole(
          auth.userId,
          auth.role,
          userId,
          adminUserRoleUpdateSchema.parse(request.body),
        ),
      });
    }),
  );

  router.patch(
    '/admin/users/:id/notes',
    requireAuth(config),
    requireAdmin,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const userId = request.params.id;
      if (!userId) throw new HttpError(404, 'User not found');
      response.status(201).json({
        note: await addUserNote(
          auth.userId,
          auth.role,
          userId,
          adminUserNoteSchema.parse(request.body),
        ),
      });
    }),
  );

  router.get(
    '/admin/audit-logs',
    requireAuth(config),
    requireRoles(['SUPER_ADMIN', 'ADMIN']),
    asyncHandler(async (request, response) => {
      response.status(200).json(await listAuditLogs(auditLogQuerySchema.parse(request.query)));
    }),
  );

  router.get(
    '/admin/profiles',
    requireAuth(config),
    requireAdmin,
    asyncHandler(async (request, response) => {
      const input = profileModerationQuerySchema.parse(request.query);
      response.status(200).json({ profiles: await listProfilesForModeration(input) });
    }),
  );

  router.get(
    '/admin/profiles/:id',
    requireAuth(config),
    requireAdmin,
    asyncHandler(async (request, response) => {
      const profileId = request.params.id;
      if (!profileId) throw new HttpError(404, 'Profile not found');
      response.status(200).json({ profile: await getProfileModerationDetail(profileId) });
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
        profile: await reviewProfile(auth.userId, auth.role, profileId, input),
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
    '/me/verifications/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const requestId = request.params.id;
      if (!requestId) throw new HttpError(404, 'Verification request not found');
      response
        .status(200)
        .json({ request: await getOwnVerificationRequest(auth.userId, requestId) });
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
        request: await reviewVerificationRequest(auth.userId, auth.role, requestId, input),
        message: 'Verification reviewed',
      });
    }),
  );

  router.get(
    '/admin/verifications/:id',
    requireAuth(config),
    requireAdmin,
    asyncHandler(async (request, response) => {
      const requestId = request.params.id;
      if (!requestId) throw new HttpError(404, 'Verification request not found');
      response.status(200).json(await getVerificationRequestDetail(requestId));
    }),
  );

  return router;
}
