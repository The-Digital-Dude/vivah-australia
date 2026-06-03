import type { NextFunction, Response } from 'express';
import { AccountStatus, UserRole, type UserRole as UserRoleType } from '@vivah/shared';
import { UserModel } from '../models/index.js';
import type { AuthConfig, AuthenticatedRequest } from './auth-types.js';
import { HttpError } from './auth-errors.js';
import { verifyAccessToken } from './token.service.js';

export const AdminPermission = {
  DASHBOARD_READ: 'admin.dashboard.read',
  ANALYTICS_READ: 'admin.analytics.read',
  FRAUD_MANAGE: 'admin.fraud.manage',
  MODERATION_MANAGE: 'admin.moderation.manage',
  USERS_READ: 'admin.users.read',
  USERS_MANAGE: 'admin.users.manage',
  USER_ROLES_MANAGE: 'admin.user_roles.manage',
  AUDIT_READ: 'admin.audit.read',
  PROFILES_REVIEW: 'admin.profiles.review',
  VERIFICATIONS_REVIEW: 'admin.verifications.review',
} as const;

export type AdminPermission =
  (typeof AdminPermission)[keyof typeof AdminPermission];

const rolePermissions: Record<UserRoleType, AdminPermission[]> = {
  [UserRole.USER]: [],
  [UserRole.PREMIUM_USER]: [],
  [UserRole.MODERATOR]: [
    AdminPermission.DASHBOARD_READ,
    AdminPermission.MODERATION_MANAGE,
    AdminPermission.USERS_READ,
    AdminPermission.PROFILES_REVIEW,
    AdminPermission.VERIFICATIONS_REVIEW,
  ],
  [UserRole.ADMIN]: [
    AdminPermission.DASHBOARD_READ,
    AdminPermission.ANALYTICS_READ,
    AdminPermission.FRAUD_MANAGE,
    AdminPermission.MODERATION_MANAGE,
    AdminPermission.USERS_READ,
    AdminPermission.USERS_MANAGE,
    AdminPermission.USER_ROLES_MANAGE,
    AdminPermission.AUDIT_READ,
    AdminPermission.PROFILES_REVIEW,
    AdminPermission.VERIFICATIONS_REVIEW,
  ],
  [UserRole.SUPER_ADMIN]: Object.values(AdminPermission),
};

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

export function requireRoles(roles: UserRoleType[]) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    if (!request.auth) {
      next(new HttpError(401, 'Authentication required'));
      return;
    }

    if (!roles.includes(request.auth.role)) {
      next(new HttpError(403, 'Admin access required'));
      return;
    }

    next();
  };
}

export function requirePermission(permission: AdminPermission) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    if (!request.auth) {
      next(new HttpError(401, 'Authentication required'));
      return;
    }

    const permissions = rolePermissions[request.auth.role] ?? [];
    if (!permissions.includes(permission)) {
      next(new HttpError(403, 'Insufficient permission'));
      return;
    }

    next();
  };
}

export const requireAdmin = requireRoles([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MODERATOR,
]);
export const requireSuperAdmin = requireRoles([UserRole.SUPER_ADMIN]);
