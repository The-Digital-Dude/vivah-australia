import type { NextFunction, Response } from 'express';
import { AccountStatus } from '@vivah/shared';
import { UserModel } from '../models/index.js';
import type { AuthConfig, AuthenticatedRequest } from './auth-types.js';
import { HttpError } from './auth-errors.js';
import { verifyAccessToken } from './token.service.js';

export function requireAuth(config: AuthConfig) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    void (async () => {
      const header = request.header('authorization');

      if (!header?.startsWith('Bearer ')) {
        throw new HttpError(401, 'Authentication required');
      }

      const token = header.slice('Bearer '.length);
      const payload = verifyAccessToken(config, token);
      const user = await UserModel.findById(payload.sub).orFail();

      if (user.status !== AccountStatus.ACTIVE || user.isDeleted) {
        throw new HttpError(403, 'Account is not active');
      }

      request.auth = { userId: user._id, role: user.role };
      next();
    })().catch((error: unknown) => {
      next(error);
    });
  };
}
