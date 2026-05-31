import { Router, type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerEmailSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@vivah/shared';
import { requireAuth } from './auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from './auth-types.js';
import {
  changePassword,
  loginWithEmail,
  logout,
  refreshSession,
  registerWithEmail,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from './auth.service.js';

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

export function createAuthRouter(config: AuthConfig): Router {
  const router = Router();

  router.post(
    '/register/email',
    authRateLimit,
    asyncHandler(async (request: Request, response: Response) => {
      const input = registerEmailSchema.parse(request.body);
      const result = await registerWithEmail(input, config);
      response.status(201).json(result);
    }),
  );

  router.post(
    '/verify-email',
    authRateLimit,
    asyncHandler(async (request: Request, response: Response) => {
      const input = verifyEmailSchema.parse(request.body);
      await verifyEmail(input.token);
      response.status(200).json({ message: 'Email verified' });
    }),
  );

  router.post(
    '/login',
    authRateLimit,
    asyncHandler(async (request: Request, response: Response) => {
      const input = loginSchema.parse(request.body);
      const result = await loginWithEmail(input, config);
      response.status(200).json(result);
    }),
  );

  router.post(
    '/refresh',
    authRateLimit,
    asyncHandler(async (request: Request, response: Response) => {
      const input = refreshTokenSchema.parse(request.body);
      const result = await refreshSession(input.refreshToken, config);
      response.status(200).json(result);
    }),
  );

  router.post(
    '/logout',
    authRateLimit,
    asyncHandler(async (request: Request, response: Response) => {
      const input = logoutSchema.parse(request.body);
      await logout(input.refreshToken, config);
      response.status(204).send();
    }),
  );

  router.post(
    '/forgot-password',
    passwordResetRateLimit,
    asyncHandler(async (request: Request, response: Response) => {
      const input = forgotPasswordSchema.parse(request.body);
      const result = await requestPasswordReset(input.email, config);
      response.status(200).json({
        message: 'If an account exists, a reset link will be sent.',
        ...result,
      });
    }),
  );

  router.post(
    '/reset-password',
    passwordResetRateLimit,
    asyncHandler(async (request: Request, response: Response) => {
      const input = resetPasswordSchema.parse(request.body);
      await resetPassword(input.token, input.password);
      response.status(200).json({ message: 'Password reset complete' });
    }),
  );

  router.post(
    '/change-password',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response: Response) => {
      if (!request.auth) {
        response.status(401).json({ message: 'Authentication required' });
        return;
      }

      const input = changePasswordSchema.parse(request.body);
      await changePassword(request.auth.userId, input);
      response.status(200).json({ message: 'Password changed' });
    }),
  );

  return router;
}
