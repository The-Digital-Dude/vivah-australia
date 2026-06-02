import { z } from 'zod';
import { Types } from 'mongoose';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { HttpError } from '../auth/auth-errors.js';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { ProfileApprovalStatus, ProfileModel } from '../models/index.js';
import {
  getPhotoRequestStatus,
  getPrivateGalleryIfGranted,
  listIncomingPhotoRequests,
  listOutgoingPhotoRequests,
  respondToPhotoRequest,
  sendPhotoRequest,
  withdrawPhotoRequest,
} from './photo-requests.service.js';

// ── Schemas ───────────────────────────────────────────────────────────────────

const sendPhotoRequestSchema = z.object({
  profileId: z.string().min(1),
  message: z.string().trim().max(200).optional(),
});

const respondPhotoRequestSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Router factory ────────────────────────────────────────────────────────────

export function createPhotoRequestsRouter(config: AuthConfig): Router {
  const router = Router();

  // POST /api/me/photo-requests — send a request to see someone's private gallery
  router.post(
    '/me/photo-requests',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = sendPhotoRequestSchema.parse(request.body);
      const photoRequest = await sendPhotoRequest(auth.userId, input.profileId, input.message);
      response.status(201).json({ photoRequest, message: 'Photo access request sent' });
    }),
  );

  // GET /api/me/photo-requests — list sent (outgoing) requests
  router.get(
    '/me/photo-requests',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const requests = await listOutgoingPhotoRequests(auth.userId);
      response.status(200).json({ requests });
    }),
  );

  // GET /api/me/photo-requests/incoming — list received (incoming) requests
  router.get(
    '/me/photo-requests/incoming',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const requests = await listIncomingPhotoRequests(auth.userId);
      response.status(200).json({ requests });
    }),
  );

  // GET /api/me/photo-requests/status/:ownerProfileId — check access status for a profile
  router.get(
    '/me/photo-requests/status/:ownerProfileId',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const { ownerProfileId } = request.params;

      if (!ownerProfileId) {
        throw new HttpError(400, 'ownerProfileId is required');
      }

      if (!Types.ObjectId.isValid(ownerProfileId)) {
        response.status(200).json({ status: 'NONE', hasAccess: false, requestId: null, accessGrantedUntil: null });
        return;
      }

      const ownerProfile = await ProfileModel.findOne({
        _id: ownerProfileId,
        isDeleted: false,
        'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
      }).lean();

      if (!ownerProfile) {
        response.status(200).json({ status: 'NONE', hasAccess: false, requestId: null, accessGrantedUntil: null });
        return;
      }

      const statusInfo = await getPhotoRequestStatus(auth.userId, ownerProfile.userId);
      response.status(200).json(statusInfo);
    }),
  );

  // PATCH /api/me/photo-requests/:id — owner responds (ACCEPT or REJECT)
  router.patch(
    '/me/photo-requests/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const requestId = request.params.id;

      if (!requestId) {
        throw new HttpError(404, 'Request not found');
      }

      const input = respondPhotoRequestSchema.parse(request.body);
      const photoRequest = await respondToPhotoRequest(auth.userId, requestId, input.action);
      response.status(200).json({
        photoRequest,
        message: input.action === 'ACCEPT' ? 'Photo access granted' : 'Request declined',
      });
    }),
  );

  // DELETE /api/me/photo-requests/:id — requester withdraws a pending request
  router.delete(
    '/me/photo-requests/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const requestId = request.params.id;

      if (!requestId) {
        throw new HttpError(404, 'Request not found');
      }

      const photoRequest = await withdrawPhotoRequest(auth.userId, requestId);
      response.status(200).json({ photoRequest, message: 'Request withdrawn' });
    }),
  );

  // GET /api/profiles/:profileId/private-gallery — fetch private photos if access granted
  router.get(
    '/profiles/:profileId/private-gallery',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const { profileId } = request.params;

      if (!profileId) {
        throw new HttpError(404, 'Profile not found');
      }

      const photos = await getPrivateGalleryIfGranted(auth.userId, profileId);
      response.status(200).json({ photos });
    }),
  );

  return router;
}
