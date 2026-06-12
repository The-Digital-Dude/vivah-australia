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
import {
  AdminPermission,
  requireAuth,
  requirePermission,
} from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { HttpError } from '../auth/auth-errors.js';
import {
  createVerificationRequest,
  addUserNote,
  getAnalyticsCsv,
  getAnalyticsSummary,
  getDashboardSummary,
  getFraudEvents,
  getModerationDashboard,
  getOwnVerificationRequest,
  getProfileModerationDetail,
  getUserDetail,
  getVerificationDocumentPreview,
  getVerificationRequestDetail,
  listAuditLogs,
  listOwnVerificationRequests,
  listProfilesForModeration,
  listUsers,
  listVerificationRequests,
  performModerationAction,
  recalculateVerificationBadges,
  reviewProfile,
  reviewVerificationRequest,
  updateFraudEventStatus,
  updateUserRole,
  updateUserStatus,
  updateUser,
  getRevenueAnalytics,
  getVerificationAnalytics,
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

function parseDateQuery(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'Invalid date range');
  }
  return date;
}

function analyticsRangeFromQuery(query: Request['query']) {
  const from = parseDateQuery(query.from);
  const to = parseDateQuery(query.to);
  return {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

export function createAdminRouter(config: AuthConfig): Router {
  const router = Router();

  router.get(
    '/admin/dashboard/summary',
    requireAuth(config),
    requirePermission(AdminPermission.DASHBOARD_READ),
    asyncHandler(async (_request, response) => {
      response.status(200).json(await getDashboardSummary());
    }),
  );

  router.get(
    '/admin/moderation/dashboard',
    requireAuth(config),
    requirePermission(AdminPermission.DASHBOARD_READ),
    asyncHandler(async (_request, response) => {
      response.status(200).json(await getModerationDashboard());
    }),
  );

  router.get(
    '/admin/analytics/summary',
    requireAuth(config),
    requirePermission(AdminPermission.ANALYTICS_READ),
    asyncHandler(async (request, response) => {
      response.status(200).json(await getAnalyticsSummary(analyticsRangeFromQuery(request.query)));
    }),
  );

  router.get(
    '/admin/analytics/revenue',
    requireAuth(config),
    requirePermission(AdminPermission.ANALYTICS_READ),
    asyncHandler(async (request, response) => {
      response.status(200).json(await getRevenueAnalytics(analyticsRangeFromQuery(request.query)));
    }),
  );

  router.get(
    '/admin/analytics/verification',
    requireAuth(config),
    requirePermission(AdminPermission.ANALYTICS_READ),
    asyncHandler(async (_request, response) => {
      response.status(200).json(await getVerificationAnalytics());
    }),
  );

  router.get(
    '/admin/analytics/export.csv',
    requireAuth(config),
    requirePermission(AdminPermission.ANALYTICS_READ),
    asyncHandler(async (request, response) => {
      const csv = await getAnalyticsCsv(analyticsRangeFromQuery(request.query));
      response
        .status(200)
        .setHeader('Content-Type', 'text/csv; charset=utf-8')
        .setHeader('Content-Disposition', 'attachment; filename="vivah-admin-analytics.csv"')
        .send(csv);
    }),
  );

  router.get(
    '/admin/fraud/events',
    requireAuth(config),
    requirePermission(AdminPermission.FRAUD_MANAGE),
    asyncHandler(async (_request, response) => {
      response.status(200).json(await getFraudEvents());
    }),
  );

  router.patch(
    '/admin/fraud/events/:id',
    requireAuth(config),
    requirePermission(AdminPermission.FRAUD_MANAGE),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const eventId = request.params.id;
      const body = request.body as { status?: unknown };
      const status = typeof body.status === 'string' ? body.status : '';
      if (!eventId || (status !== 'REVIEWED' && status !== 'DISMISSED')) {
        throw new HttpError(400, 'Valid fraud review status is required');
      }
      response
        .status(200)
        .json({ event: await updateFraudEventStatus(auth.userId, eventId, status) });
    }),
  );

  router.patch(
    '/admin/moderation/reports/:id/action',
    requireAuth(config),
    requirePermission(AdminPermission.MODERATION_MANAGE),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const reportId = request.params.id;
      const body = request.body as { action?: unknown };
      const action = typeof body.action === 'string' ? body.action : '';
      if (!reportId || !['WARN', 'SUSPEND', 'BAN', 'REMOVE_CONTENT', 'DISMISS'].includes(action)) {
        throw new HttpError(400, 'Valid moderation action is required');
      }
      response.status(200).json({
        report: await performModerationAction(
          auth.userId,
          auth.role,
          reportId,
          action as 'WARN' | 'SUSPEND' | 'BAN' | 'REMOVE_CONTENT' | 'DISMISS',
        ),
        message: 'Moderation action applied',
      });
    }),
  );

  router.get(
    '/admin/users',
    requireAuth(config),
    requirePermission(AdminPermission.USERS_READ),
    asyncHandler(async (request, response) => {
      response.status(200).json(await listUsers(adminUserQuerySchema.parse(request.query)));
    }),
  );

  router.patch(
    '/admin/users/:id',
    requireAuth(config),
    requirePermission(AdminPermission.USERS_MANAGE),
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
    requirePermission(AdminPermission.USERS_READ),
    asyncHandler(async (request, response) => {
      const userId = request.params.id;
      if (!userId) throw new HttpError(404, 'User not found');
      response.status(200).json(await getUserDetail(userId));
    }),
  );

  router.patch(
    '/admin/users/:id/status',
    requireAuth(config),
    requirePermission(AdminPermission.USERS_MANAGE),
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
    requirePermission(AdminPermission.USER_ROLES_MANAGE),
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
    requirePermission(AdminPermission.USERS_READ),
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
    requirePermission(AdminPermission.AUDIT_READ),
    asyncHandler(async (request, response) => {
      response.status(200).json(await listAuditLogs(auditLogQuerySchema.parse(request.query)));
    }),
  );

  router.get(
    '/admin/profiles',
    requireAuth(config),
    requirePermission(AdminPermission.PROFILES_REVIEW),
    asyncHandler(async (request, response) => {
      const input = profileModerationQuerySchema.parse(request.query);
      response.status(200).json({ profiles: await listProfilesForModeration(input) });
    }),
  );

  router.get(
    '/admin/profiles/:id',
    requireAuth(config),
    requirePermission(AdminPermission.PROFILES_REVIEW),
    asyncHandler(async (request, response) => {
      const profileId = request.params.id;
      if (!profileId) throw new HttpError(404, 'Profile not found');
      response.status(200).json({ profile: await getProfileModerationDetail(profileId) });
    }),
  );

  router.patch(
    '/admin/profiles/:id/review',
    requireAuth(config),
    requirePermission(AdminPermission.PROFILES_REVIEW),
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
    requirePermission(AdminPermission.VERIFICATIONS_REVIEW),
    asyncHandler(async (request, response) => {
      const status =
        typeof request.query.status === 'string'
          ? verificationStatusSchema.parse(request.query.status)
          : VerificationStatus.PENDING;
      response.status(200).json({ requests: await listVerificationRequests(status) });
    }),
  );

  router.post(
    '/admin/verifications/recalculate-badges',
    requireAuth(config),
    requirePermission(AdminPermission.ANALYTICS_READ),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json({
        result: await recalculateVerificationBadges(auth.userId, auth.role),
        message: 'Verification badges recalculated',
      });
    }),
  );

  router.patch(
    '/admin/verifications/:id/review',
    requireAuth(config),
    requirePermission(AdminPermission.VERIFICATIONS_REVIEW),
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
    requirePermission(AdminPermission.VERIFICATIONS_REVIEW),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const requestId = request.params.id;
      if (!requestId) throw new HttpError(404, 'Verification request not found');
      response.status(200).json(await getVerificationRequestDetail(requestId, auth.userId));
    }),
  );

  router.get(
    '/admin/verifications/:id/documents/:documentId/preview',
    requireAuth(config),
    requirePermission(AdminPermission.VERIFICATIONS_REVIEW),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const requestId = request.params.id;
      const documentId = request.params.documentId;
      if (!requestId || !documentId) throw new HttpError(404, 'Verification document not found');
      response.status(200).json({
        preview: await getVerificationDocumentPreview(
          auth.userId,
          auth.role,
          requestId,
          documentId,
        ),
      });
    }),
  );

  return router;
}
