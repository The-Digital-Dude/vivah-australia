import express, { type Router, type Response } from 'express';
import { asyncHandler } from '../common/async-handler.js';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { initiateLivenessCheck, processKycWebhook } from './kyc.service.js';

export function createVerificationRouter(config: AuthConfig): Router {
  const router = express.Router();

  router.post(
    '/verification/liveness/start',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response: Response) => {
      const result = await initiateLivenessCheck(request.auth!.userId);
      response.status(200).json(result);
    }),
  );

  // Webhook for the KYC provider to POST results to
  router.post(
    '/verification/liveness/webhook',
    asyncHandler(async (request: Request, response: Response) => {
      // Typically you'd verify signature/auth headers here
      await processKycWebhook(request.body);
      response.status(200).json({ success: true });
    }),
  );

  return router;
}
