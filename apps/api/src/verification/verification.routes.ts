import express, { type Router, type Request, type Response } from 'express';
import { asyncHandler } from '../common/async-handler.js';
import { requireAuth } from '../auth/require-auth.js';
import type { AuthConfig } from '../auth/auth-types.js';
import { initiateLivenessCheck, processKycWebhook } from './kyc.service.js';

export function createVerificationRouter(config: AuthConfig): Router {
  const router = express.Router();

  // Route to initiate liveness check
  router.post(
    '/verification/liveness/start',
    requireAuth(config),
    asyncHandler(async (request: Request, response: Response) => {
      const result = await initiateLivenessCheck(request.user.id);
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
