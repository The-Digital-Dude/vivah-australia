import { profileSearchQuerySchema, recommendedMatchesQuerySchema } from '@vivah/shared';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { HttpError } from '../auth/auth-errors.js';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { recommendedMatches, searchProfiles } from './match.service.js';

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

export function createMatchRouter(config: AuthConfig): Router {
  const router = Router();

  router.get(
    '/matches/search',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const query = {
        ...request.query,
        pageSize: request.query.pageSize ?? request.query.limit,
      };
      const input = profileSearchQuerySchema.parse(query);
      const result = await searchProfiles(auth.userId, input);
      response.status(200).json(result);
    }),
  );

  router.get(
    '/matches/recommended',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = recommendedMatchesQuerySchema.parse(request.query);
      const result = await recommendedMatches(auth.userId, input.limit);
      response.status(200).json(result);
    }),
  );

  return router;
}
