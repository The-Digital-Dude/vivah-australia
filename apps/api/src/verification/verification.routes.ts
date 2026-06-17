import express, { type Request, type Router, type Response } from 'express';
import { asyncHandler } from '../common/async-handler.js';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import {
  verificationDocumentCompleteUploadSchema,
  verificationDocumentSignUploadSchema,
} from '@vivah/shared';
import { initiateLivenessCheck, processKycWebhook } from './kyc.service.js';
import {
  completeSignedVerificationDocumentUpload,
  createSignedVerificationDocumentUpload,
} from './verification-document.service.js';

export function createVerificationRouter(config: AuthConfig): Router {
  const router = express.Router();

  router.post(
    '/me/verification-documents/sign-upload',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response: Response) => {
      const result = await createSignedVerificationDocumentUpload(
        request.auth!.userId,
        verificationDocumentSignUploadSchema.parse(request.body),
      );
      response.status(201).json(result);
    }),
  );

  router.post(
    '/me/verification-documents/complete',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response: Response) => {
      const document = await completeSignedVerificationDocumentUpload(
        request.auth!.userId,
        verificationDocumentCompleteUploadSchema.parse(request.body),
      );
      response.status(200).json({ document });
    }),
  );

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
    asyncHandler((_request: Request, response: Response) =>
      Promise.resolve().then(() => {
        // Typically you'd verify signature/auth headers here
        processKycWebhook();
        response.status(200).json({ success: true });
      }),
    ),
  );

  return router;
}
