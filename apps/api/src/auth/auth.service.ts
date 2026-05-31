import bcrypt from 'bcryptjs';
import {
  AccountStatus,
  UserRole,
  type ChangePasswordInput,
  type LoginInput,
  type RegisterEmailInput,
} from '@vivah/shared';
import type { Types } from 'mongoose';
import {
  AuthProvider,
  AuthTokenModel,
  AuthTokenPurpose,
  ProfileModel,
  UserModel,
  type UserDocument,
} from '../models/index.js';
import { HttpError } from './auth-errors.js';
import type { AuthConfig } from './auth-types.js';
import {
  createOpaqueToken,
  createTokenPair,
  hashToken,
  verifyRefreshToken,
  type TokenPair,
} from './token.service.js';

const PASSWORD_HASH_ROUNDS = 12;
const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export interface RegisterResult {
  user: {
    id: string;
    email: string;
    status: string;
  };
  verificationToken?: string;
}

export interface AuthResult extends TokenPair {
  user: {
    id: string;
    email?: string;
    role: string;
  };
}

async function createAuthToken(userId: Types.ObjectId, purpose: AuthTokenPurpose, ttlMs: number) {
  const token = createOpaqueToken();

  await AuthTokenModel.create({
    userId,
    purpose,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlMs),
  });

  return token;
}

function publicUser(user: UserDocument) {
  return {
    id: user.id,
    role: user.role,
    ...(user.email ? { email: user.email } : {}),
  };
}

export async function registerWithEmail(
  input: RegisterEmailInput,
  config: AuthConfig,
): Promise<RegisterResult> {
  const existingUser = await UserModel.findOne({ email: input.email });

  if (existingUser) {
    throw new HttpError(409, 'Email is already registered');
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);
  const user = await UserModel.create({
    email: input.email,
    passwordHash,
    authProviders: [AuthProvider.EMAIL],
    role: UserRole.USER,
    status: AccountStatus.PENDING,
    emailVerified: false,
    mobileVerified: false,
    failedLoginAttempts: 0,
    refreshTokenVersion: 0,
    termsAcceptedAt: now,
    privacyAcceptedAt: now,
    marketingConsent: input.marketingConsent,
    metadata: {},
  });

  await ProfileModel.create({
    userId: user._id,
    displayId: `VA${user._id.toString().slice(-8).toUpperCase()}`,
    completionPercentage: 10,
    personal: {
      firstName: input.firstName,
      lastName: input.lastName,
    },
    religion: { languagesSpoken: [] },
    location: {},
    education: { additionalCertifications: [] },
    employment: { annualIncomeVisibility: 'PRIVATE' },
    family: {},
    lifestyle: { fitnessInterests: [] },
    about: { hobbies: [], interests: [] },
    partnerPreference: {},
    verification: {
      level: 'NONE',
      emailVerified: false,
      mobileVerified: false,
      identityVerified: false,
      addressVerified: false,
      employmentVerified: false,
      visaVerified: false,
      policeClearanceVerified: false,
      facialVerified: false,
    },
    visibility: {
      status: 'MEMBERS_ONLY',
      showPhoto: true,
      showIncome: false,
      showEmployer: false,
      showLastName: false,
    },
    stats: {
      profileViews: 0,
      interestsReceived: 0,
      interestsSent: 0,
      favouritesCount: 0,
    },
    moderation: {
      approvalStatus: 'PENDING',
    },
  });

  const verificationToken = await createAuthToken(
    user._id,
    AuthTokenPurpose.EMAIL_VERIFICATION,
    EMAIL_TOKEN_TTL_MS,
  );

  return {
    user: {
      id: user.id,
      email: user.email ?? input.email,
      status: user.status,
    },
    ...(config.exposeSensitiveTokens ? { verificationToken } : {}),
  };
}

export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const authToken = await AuthTokenModel.findOne({
    tokenHash,
    purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!authToken) {
    throw new HttpError(400, 'Invalid or expired verification token');
  }

  await UserModel.updateOne(
    { _id: authToken.userId },
    {
      $set: {
        emailVerified: true,
        status: AccountStatus.ACTIVE,
      },
    },
  );
  await ProfileModel.updateOne(
    { userId: authToken.userId },
    {
      $set: {
        'verification.emailVerified': true,
      },
    },
  );
  authToken.usedAt = new Date();
  await authToken.save();
}

export async function loginWithEmail(input: LoginInput, config: AuthConfig): Promise<AuthResult> {
  const user = await UserModel.findOne({ email: input.email });

  if (!user?.passwordHash) {
    throw new HttpError(401, 'Invalid email or password');
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new HttpError(423, 'Account is temporarily locked');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    user.failedLoginAttempts = failedLoginAttempts;

    if (failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }

    await user.save();
    throw new HttpError(401, 'Invalid email or password');
  }

  if (user.status !== AccountStatus.ACTIVE || !user.emailVerified) {
    throw new HttpError(403, 'Account is not active');
  }

  user.failedLoginAttempts = 0;
  user.set('lockUntil', undefined);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: publicUser(user),
    ...createTokenPair(config, {
      id: user.id,
      role: user.role,
      refreshTokenVersion: user.refreshTokenVersion,
    }),
  };
}

export async function refreshSession(
  refreshToken: string,
  config: AuthConfig,
): Promise<AuthResult> {
  const payload = verifyRefreshToken(config, refreshToken);
  const user = await UserModel.findById(payload.sub).orFail();

  if (
    user.status !== AccountStatus.ACTIVE ||
    user.refreshTokenVersion !== payload.version ||
    user.isDeleted
  ) {
    throw new HttpError(401, 'Invalid refresh token');
  }

  user.refreshTokenVersion += 1;
  await user.save();

  return {
    user: publicUser(user),
    ...createTokenPair(config, {
      id: user.id,
      role: user.role,
      refreshTokenVersion: user.refreshTokenVersion,
    }),
  };
}

export async function logout(refreshToken: string, config: AuthConfig): Promise<void> {
  const payload = verifyRefreshToken(config, refreshToken);
  await UserModel.updateOne(
    { _id: payload.sub, refreshTokenVersion: payload.version },
    { $inc: { refreshTokenVersion: 1 } },
  );
}

export async function requestPasswordReset(email: string, config: AuthConfig) {
  const user = await UserModel.findOne({ email });

  if (!user) {
    return {};
  }

  const resetToken = await createAuthToken(
    user._id,
    AuthTokenPurpose.PASSWORD_RESET,
    PASSWORD_RESET_TTL_MS,
  );

  return config.exposeSensitiveTokens ? { resetToken } : {};
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const authToken = await AuthTokenModel.findOne({
    tokenHash: hashToken(token),
    purpose: AuthTokenPurpose.PASSWORD_RESET,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!authToken) {
    throw new HttpError(400, 'Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
  await UserModel.updateOne(
    { _id: authToken.userId },
    {
      $set: {
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
      },
      $unset: { lockUntil: '' },
      $inc: { refreshTokenVersion: 1 },
    },
  );

  authToken.usedAt = new Date();
  await authToken.save();
}

export async function changePassword(
  userId: Types.ObjectId,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await UserModel.findById(userId).orFail();

  if (!user.passwordHash) {
    throw new HttpError(400, 'Password login is not configured');
  }

  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, 'Current password is incorrect');
  }

  user.passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_HASH_ROUNDS);
  user.passwordChangedAt = new Date();
  user.refreshTokenVersion += 1;
  await user.save();
}
