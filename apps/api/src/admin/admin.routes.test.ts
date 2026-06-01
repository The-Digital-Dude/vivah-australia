import request from 'supertest';
import type { Response } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, Gender, UserRole, VerificationStatus } from '@vivah/shared';
import { createApp } from '../app.js';
import type { AuthConfig } from '../auth/auth-types.js';
import { createTokenPair } from '../auth/token.service.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  ActivityLogModel,
  AuditLogModel,
  NotificationModel,
  ProfileApprovalStatus,
  ProfileModel,
  ReportModel,
  UserModel,
  VerificationRequestModel,
} from '../models/index.js';

const authConfig: AuthConfig = {
  accessSecret: 'test-access-secret-minimum-32-characters',
  refreshSecret: 'test-refresh-secret-minimum-32-characters',
  accessExpiresIn: '15m',
  refreshExpiresIn: '30d',
  exposeSensitiveTokens: true,
};

const app = createApp({ corsOrigins: ['http://localhost:3000'], auth: authConfig });
let mongoServer: MongoMemoryServer;

function bodyAs<T>(response: Response): T {
  return response.body as T;
}

async function createUser(email: string, role = UserRole.USER) {
  const user = await UserModel.create({
    email,
    authProviders: ['email'],
    role,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    mobileVerified: false,
    failedLoginAttempts: 0,
    refreshTokenVersion: 0,
    marketingConsent: false,
    metadata: {},
  });
  const accessToken = createTokenPair(authConfig, {
    id: user.id,
    role: user.role,
    refreshTokenVersion: user.refreshTokenVersion,
  }).accessToken;
  return { user, accessToken };
}

async function createProfile(userId: mongoose.Types.ObjectId) {
  return ProfileModel.create({
    userId,
    displayId: `VA${Date.now()}`,
    completionPercentage: 100,
    personal: {
      firstName: 'Priya',
      lastName: 'Member',
      gender: Gender.FEMALE,
      age: 29,
      dateOfBirth: new Date('1996-01-01'),
      maritalStatus: 'NEVER_MARRIED',
    },
    religion: { languagesSpoken: ['English'] },
    location: { country: 'Australia', city: 'Sydney' },
    education: {},
    employment: { annualIncomeVisibility: 'PRIVATE' },
    family: {},
    lifestyle: {},
    about: {},
    partnerPreference: {},
    verification: {
      level: 'NONE',
      emailVerified: true,
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
    stats: { profileViews: 0, interestsReceived: 0, interestsSent: 0, favouritesCount: 0 },
    moderation: { approvalStatus: ProfileApprovalStatus.PENDING },
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDatabase(mongoServer.getUri());
}, 180000);

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer?.stop();
});

describe('admin production readiness routes', () => {
  it('enforces admin RBAC and returns dashboard summary', async () => {
    const member = await createUser('member@example.com');
    const admin = await createUser('admin@example.com', UserRole.ADMIN);
    await createProfile(member.user._id);
    await ReportModel.create({
      reporterId: member.user._id,
      targetType: 'USER',
      reason: 'Suspicious profile needs review.',
      status: 'OPEN',
      severity: 'LOW',
    });

    await request(app)
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(403);

    const response = await request(app)
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      totalUsers: 2,
      pendingProfiles: 1,
      openReports: 1,
    });
  });

  it('manages users and writes audit logs', async () => {
    const admin = await createUser('admin-users@example.com', UserRole.ADMIN);
    const member = await createUser('target@example.com');

    await request(app)
      .patch(`/api/admin/users/${member.user.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: AccountStatus.SUSPENDED })
      .expect(200);

    expect((await UserModel.findById(member.user._id).orFail()).status).toBe(
      AccountStatus.SUSPENDED,
    );
    expect(await AuditLogModel.countDocuments({ action: 'ADMIN_USER_UPDATED' })).toBe(1);
  });

  it('reviews profiles and sends notification/email records', async () => {
    const admin = await createUser('admin-profiles@example.com', UserRole.MODERATOR);
    const member = await createUser('profile-owner@example.com');
    const profile = await createProfile(member.user._id);

    await request(app)
      .patch(`/api/admin/profiles/${profile.id}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ action: 'APPROVE' })
      .expect(200);

    expect((await ProfileModel.findById(profile._id).orFail()).moderation.approvalStatus).toBe(
      ProfileApprovalStatus.APPROVED,
    );
    expect(await NotificationModel.countDocuments({ type: 'PROFILE_REVIEWED' })).toBe(1);
  });

  it('creates and reviews verification requests, updating badge logic', async () => {
    const admin = await createUser('admin-verify@example.com', UserRole.ADMIN);
    const member = await createUser('verify@example.com');
    await createProfile(member.user._id);

    const createResponse = await request(app)
      .post('/api/me/verifications')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ type: 'IDENTITY', documentType: 'Passport', storageKey: 'secure/passport.jpg' })
      .expect(201);

    const created = bodyAs<{ request: { _id: string } }>(createResponse);

    await request(app)
      .patch(`/api/admin/verifications/${created.request._id}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: VerificationStatus.APPROVED })
      .expect(200);

    const profile = await ProfileModel.findOne({ userId: member.user._id }).orFail();
    expect(profile.verification.identityVerified).toBe(true);
    expect(profile.verification.level).toBe('SILVER');
    expect(
      await VerificationRequestModel.countDocuments({ status: VerificationStatus.APPROVED }),
    ).toBe(1);
    expect(await ActivityLogModel.countDocuments({ event: 'VERIFICATION_REQUEST_CREATED' })).toBe(
      1,
    );
  });
});
