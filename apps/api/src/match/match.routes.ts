import {
  profileSearchQuerySchema,
  recommendedMatchesQuerySchema,
  savedSearchCreateSchema,
} from '@vivah/shared';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { HttpError } from '../auth/auth-errors.js';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import {
  createSavedSearch,
  deleteSavedSearch,
  listSavedSearches,
  recommendedMatches,
  searchProfiles,
} from './match.service.js';


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

  /**
   * GET /matches/recommended
   *
   * Returns personalised match cards for the authenticated member.
   *
   * Query params:
   *   limit  – number of results to return (default 12, max capped by plan)
   *   mode   – recommendation mode (default: DEFAULT)
   *            • DEFAULT          – cached ML score + discovery priority
   *            • NEWLY_JOINED     – newest members first (sorted by createdAt desc)
   *            • RECENTLY_ACTIVE  – most recently active members first
   *            • HIGHLY_COMPATIBLE – highest match score first
   *            • NEARBY           – same city → same state fallback
   *                                 (prefer /matches/nearby for this mode)
   */
  router.get(
    '/matches/recommended',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = recommendedMatchesQuerySchema.parse(request.query);
      const result = await recommendedMatches(auth.userId, input.limit, input.mode ?? 'DEFAULT');
      response.status(200).json(result);
    }),
  );

  /**
   * GET /matches/nearby
   *
   * Returns members in the same city as the viewer, falling back to the same
   * state if fewer than 6 city results exist. Uses text-based proximity
   * (location.city / location.state) — no geospatial index required.
   *
   * Query params:
   *   limit – number of results to return (default 12, max capped by plan)
   */
  router.get(
    '/matches/nearby',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const { limit: rawLimit } = recommendedMatchesQuerySchema
        .pick({ limit: true })
        .parse(request.query);
      const result = await recommendedMatches(auth.userId, rawLimit, 'NEARBY');
      response.status(200).json(result);
    }),
  );

  router.get(
    '/matches/saved-searches',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json({ savedSearches: await listSavedSearches(auth.userId) });
    }),
  );

  router.post(
    '/matches/saved-searches',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = savedSearchCreateSchema.parse(request.body);
      response.status(201).json({
        savedSearch: await createSavedSearch(auth.userId, input),
        message: 'Saved search.',
      });
    }),
  );

  router.delete(
    '/matches/saved-searches/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const searchId = request.params.id;
      if (!searchId) {
        throw new HttpError(404, 'Saved search not found');
      }
      await deleteSavedSearch(auth.userId, searchId);
      response.status(204).send();
    }),
  );

  return router;
}
