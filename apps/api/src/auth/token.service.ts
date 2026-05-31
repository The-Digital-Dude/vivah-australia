import crypto from 'node:crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import type { UserRole } from '@vivah/shared';
import type { AuthConfig } from './auth-types.js';
import { HttpError } from './auth-errors.js';

interface AccessPayload extends JwtPayload {
  sub: string;
  role: UserRole;
  type: 'access';
}

interface RefreshPayload extends JwtPayload {
  sub: string;
  version: number;
  type: 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function signJwt(payload: object, secret: string, expiresIn: string): string {
  const options: SignOptions = {
    expiresIn: expiresIn as NonNullable<SignOptions['expiresIn']>,
  };
  return jwt.sign(payload, secret, options);
}

export function createOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createTokenPair(
  config: AuthConfig,
  user: { id: string; role: UserRole; refreshTokenVersion: number },
): TokenPair {
  return {
    accessToken: signJwt(
      { sub: user.id, role: user.role, type: 'access' },
      config.accessSecret,
      config.accessExpiresIn,
    ),
    refreshToken: signJwt(
      { sub: user.id, version: user.refreshTokenVersion, type: 'refresh' },
      config.refreshSecret,
      config.refreshExpiresIn,
    ),
  };
}

export function verifyAccessToken(config: AuthConfig, token: string): AccessPayload {
  let payload: string | JwtPayload;

  try {
    payload = jwt.verify(token, config.accessSecret);
  } catch {
    throw new HttpError(401, 'Invalid access token');
  }

  if (
    typeof payload !== 'object' ||
    payload.type !== 'access' ||
    typeof payload.sub !== 'string' ||
    typeof payload.role !== 'string' ||
    !Types.ObjectId.isValid(payload.sub)
  ) {
    throw new HttpError(401, 'Invalid access token');
  }

  return payload as AccessPayload;
}

export function verifyRefreshToken(config: AuthConfig, token: string): RefreshPayload {
  let payload: string | JwtPayload;

  try {
    payload = jwt.verify(token, config.refreshSecret);
  } catch {
    throw new HttpError(401, 'Invalid refresh token');
  }

  if (
    typeof payload !== 'object' ||
    payload.type !== 'refresh' ||
    typeof payload.sub !== 'string' ||
    typeof payload.version !== 'number' ||
    !Types.ObjectId.isValid(payload.sub)
  ) {
    throw new HttpError(401, 'Invalid refresh token');
  }

  return payload as RefreshPayload;
}
