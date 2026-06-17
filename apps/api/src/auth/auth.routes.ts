import { Router, type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  mobileOtpRequestSchema,
  mobileOtpVerifySchema,
  refreshTokenSchema,
  registerEmailSchema,
  registerMobileSchema,
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
  registerWithMobile,
  resendMobileRegistrationOtp,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
  verifyMobileRegistration,
} from './auth.service.js';
import { verifyGoogleToken, verifyFacebookToken, verifyAppleToken, loginOrRegisterOAuth } from './oauth.service.js';
import { HttpError } from './auth-errors.js';

function setAuthCookies(response: Response, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };
  
  response.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 mins
  response.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
}

function clearAuthCookies(response: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };
  response.clearCookie('accessToken', cookieOptions);
  response.clearCookie('refreshToken', cookieOptions);
}

function createAuthRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

function createPasswordResetRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

function authResponsePayload(
  config: AuthConfig,
  result: {
    user: Record<string, unknown>;
    accessToken?: string;
    refreshToken?: string;
  },
) {
  const payload: Record<string, unknown> = {
    user: result.user,
  };

  if (config.exposeSensitiveTokens && result.accessToken && result.refreshToken) {
    payload.accessToken = result.accessToken;
    payload.refreshToken = result.refreshToken;
  }

  return payload;
}

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
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const input = registerEmailSchema.parse(request.body);
      const result = await registerWithEmail(input, config);
      response.status(201).json(result);
    }),
  );

  router.post(
    '/register/mobile',
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const input = registerMobileSchema.parse(request.body);
      const result = await registerWithMobile(input);
      response.status(201).json({
        ...result,
        message: 'Mobile registration created. Verification code sent.',
      });
    }),
  );

  router.post(
    '/otp/send',
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const input = mobileOtpRequestSchema.parse(request.body);
      response.status(201).json(await resendMobileRegistrationOtp(input.mobile));
    }),
  );

  router.post(
    '/otp/verify',
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const input = mobileOtpVerifySchema.parse(request.body);
      const result = await verifyMobileRegistration(input.mobile, input.code, config);
      setAuthCookies(response, result.accessToken, result.refreshToken);
      response.status(200).json(authResponsePayload(config, result));
    }),
  );

  router.post(
    '/verify-email',
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const input = verifyEmailSchema.parse(request.body);
      await verifyEmail(input.token);
      response.status(200).json({ message: 'Email verified' });
    }),
  );

  router.post(
    '/resend-verification-email',
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const { email } = request.body as Record<string, unknown>;
      if (typeof email !== 'string' || !email) {
        throw new HttpError(400, 'Email is required');
      }
      const result = await resendVerificationEmail(email, config);
      response.status(200).json(result);
    }),
  );

  router.post(
    '/login',
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const input = loginSchema.parse(request.body);
      const result = await loginWithEmail(input, config);
      setAuthCookies(response, result.accessToken, result.refreshToken);
      response.status(200).json(authResponsePayload(config, result));
    }),
  );

  router.post(
    '/refresh',
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const input = refreshTokenSchema.parse(request.body);
      const refreshTokenToUse =
        (typeof request.cookies?.refreshToken === 'string'
          ? request.cookies.refreshToken
          : undefined) ?? input.refreshToken;
      if (!refreshTokenToUse) {
        throw new HttpError(400, 'Refresh token is required');
      }
      const result = await refreshSession(refreshTokenToUse, config);
      setAuthCookies(response, result.accessToken, result.refreshToken);
      response.status(200).json(authResponsePayload(config, result));
    }),
  );

  router.post(
    '/logout',
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const input = logoutSchema.partial().parse(request.body);
      const refreshTokenToUse =
        (typeof request.cookies?.refreshToken === 'string'
          ? request.cookies.refreshToken
          : undefined) ?? input.refreshToken;
      if (refreshTokenToUse) {
        await logout(refreshTokenToUse, config);
      }
      clearAuthCookies(response);
      response.status(204).send();
    }),
  );

  router.post(
    '/forgot-password',
    createPasswordResetRateLimit(),
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
    createPasswordResetRateLimit(),
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

  router.post(
    '/oauth/google',
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const { token } = request.body as Record<string, unknown>;
      if (typeof token !== 'string' || !token) {
        throw new HttpError(400, 'Token is required');
      }
      const profile = await verifyGoogleToken(token);
      const result = await loginOrRegisterOAuth('google', profile, config);
      setAuthCookies(response, result.tokenPair.accessToken, result.tokenPair.refreshToken);
      response.status(200).json({
        user: result.user,
        ...(config.exposeSensitiveTokens ? result.tokenPair : {}),
      });
    }),
  );

  router.post(
    '/oauth/facebook',
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const { token } = request.body as Record<string, unknown>;
      if (typeof token !== 'string' || !token) {
        throw new HttpError(400, 'Token is required');
      }
      const profile = await verifyFacebookToken(token);
      const result = await loginOrRegisterOAuth('facebook', profile, config);
      setAuthCookies(response, result.tokenPair.accessToken, result.tokenPair.refreshToken);
      response.status(200).json({
        user: result.user,
        ...(config.exposeSensitiveTokens ? result.tokenPair : {}),
      });
    }),
  );

  router.post(
    '/oauth/apple',
    createAuthRateLimit(),
    asyncHandler(async (request: Request, response: Response) => {
      const { token } = request.body as Record<string, unknown>;
      if (typeof token !== 'string' || !token) {
        throw new HttpError(400, 'Token is required');
      }
      const profile = await verifyAppleToken(token);
      const result = await loginOrRegisterOAuth('apple', profile, config);
      setAuthCookies(response, result.tokenPair.accessToken, result.tokenPair.refreshToken);
      response.status(200).json({
        user: result.user,
        ...(config.exposeSensitiveTokens ? result.tokenPair : {}),
      });
    }),
  );

  return router;
}
