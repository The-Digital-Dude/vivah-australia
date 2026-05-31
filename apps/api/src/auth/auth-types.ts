import type { Request } from 'express';
import type { Types } from 'mongoose';
import type { UserRole } from '@vivah/shared';

export interface AuthConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  exposeSensitiveTokens?: boolean;
}

export interface AuthenticatedUser {
  userId: Types.ObjectId;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedUser;
}
