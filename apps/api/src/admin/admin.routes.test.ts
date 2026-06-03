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
  CommunityPostModel,
  CommunityRoomModel,
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

    const moderationResponse = await request(app)
      .get('/api/admin/moderation/dashboard')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(moderationResponse.body).toMatchObject({
      counts: { pendingProfiles: 1, openReports: 1 },
    });

    const analyticsResponse = await request(app)
      .get('/api/admin/analytics/summary')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(
      bodyAs<{ usersByRole: Array<{ _id: string; count: number }> }>(analyticsResponse).usersByRole,
    ).toContainEqual(expect.objectContaining({ _id: UserRole.ADMIN, count: 1 }));
    expect(
      bodyAs<{ matchInterestStats: unknown[]; messagingActivity: unknown[] }>(analyticsResponse)
        .matchInterestStats,
    ).toEqual(expect.any(Array));

    const csvResponse = await request(app)
      .get('/api/admin/analytics/export.csv')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(csvResponse.text).toContain('section,key,count,totalCents');
  });

  it('applies permission-based admin access consistently by role', async () => {
    const moderator = await createUser('permission-moderator@example.com', UserRole.MODERATOR);
    const member = await createUser('permission-member@example.com');
    await createProfile(member.user._id);

    await request(app)
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${moderator.accessToken}`)
      .expect(200);

    await request(app)
      .get('/api/admin/analytics/summary')
      .set('Authorization', `Bearer ${moderator.accessToken}`)
      .expect(403);

    await request(app)
      .patch(`/api/admin/users/${member.user.id}/role`)
      .set('Authorization', `Bearer ${moderator.accessToken}`)
      .send({ role: UserRole.PREMIUM_USER })
      .expect(403);
  });

  it('manages users and writes audit logs', async () => {
    const admin = await createUser('admin-users@example.com', UserRole.ADMIN);
    const member = await createUser('target@example.com');
    const profile = await createProfile(member.user._id);

    const searchResponse = await request(app)
      .get(`/api/admin/users?q=${profile.displayId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(
      bodyAs<{ users: Array<{ id: string; profile?: { displayId?: string } }> }>(searchResponse)
        .users[0],
    ).toMatchObject({
      id: member.user.id,
      profile: { displayId: profile.displayId },
    });

    await request(app)
      .patch(`/api/admin/users/${member.user.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: AccountStatus.SUSPENDED })
      .expect(200);
    await request(app)
      .patch(`/api/admin/users/${member.user.id}/role`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ role: UserRole.PREMIUM_USER })
      .expect(200);
    await request(app)
      .patch(`/api/admin/users/${member.user.id}/notes`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ note: 'Called member to verify profile details.' })
      .expect(201);

    const updated = await UserModel.findById(member.user._id).orFail();
    expect(updated.status).toBe(AccountStatus.SUSPENDED);
    expect(updated.role).toBe(UserRole.PREMIUM_USER);
    const detailResponse = await request(app)
      .get(`/api/admin/users/${member.user.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(bodyAs<{ notes: Array<{ note: string }> }>(detailResponse).notes[0]?.note).toBe(
      'Called member to verify profile details.',
    );
    expect(await AuditLogModel.countDocuments({ action: 'ADMIN_USER_UPDATED' })).toBe(2);
    expect(await AuditLogModel.countDocuments({ action: 'ADMIN_USER_NOTE_ADDED' })).toBe(1);
  });

  it('protects role hierarchy and self-destructive status changes', async () => {
    const superAdmin = await createUser('super-admin@example.com', UserRole.SUPER_ADMIN);
    const admin = await createUser('limited-admin@example.com', UserRole.ADMIN);
    const moderator = await createUser('moderator@example.com', UserRole.MODERATOR);
    const member = await createUser('normal-member@example.com');

    await request(app)
      .patch(`/api/admin/users/${superAdmin.user.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: AccountStatus.SUSPENDED })
      .expect(403);

    await request(app)
      .patch(`/api/admin/users/${admin.user.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: AccountStatus.BANNED })
      .expect(403);

    await request(app)
      .patch(`/api/admin/users/${member.user.id}/role`)
      .set('Authorization', `Bearer ${moderator.accessToken}`)
      .send({ role: UserRole.PREMIUM_USER })
      .expect(403);

    await request(app)
      .patch(`/api/admin/users/${moderator.user.id}/role`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ role: UserRole.USER })
      .expect(403);

    await request(app)
      .patch(`/api/admin/users/${moderator.user.id}/role`)
      .set('Authorization', `Bearer ${superAdmin.accessToken}`)
      .send({ role: UserRole.USER })
      .expect(200);
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
    const profile = await createProfile(member.user._id);
    profile.verification.mobileVerified = true;
    await profile.save();

    const createResponse = await request(app)
      .post('/api/me/verifications')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ type: 'IDENTITY', documentType: 'Passport', storageKey: 'secure/passport.jpg' })
      .expect(201);

    const created = bodyAs<{ request: { _id: string } }>(createResponse);

    const listResponse = await request(app)
      .get('/api/admin/verifications?status=PENDING')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(
      bodyAs<{ requests: Array<{ priority?: { score: number } }> }>(listResponse).requests[0]
        ?.priority?.score,
    ).toBeGreaterThan(0);

    const detailResponse = await request(app)
      .get(`/api/admin/verifications/${created.request._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    const documentId = bodyAs<{ documents: Array<{ _id: string }> }>(detailResponse).documents[0]
      ?._id;
    expect(documentId).toEqual(expect.any(String));

    await request(app)
      .get(`/api/admin/verifications/${created.request._id}/documents/${documentId}/preview`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    await request(app)
      .patch(`/api/admin/verifications/${created.request._id}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: VerificationStatus.APPROVED })
      .expect(200);

    const reviewedProfile = await ProfileModel.findOne({ userId: member.user._id }).orFail();
    expect(reviewedProfile.verification.identityVerified).toBe(true);
    expect(reviewedProfile.verification.level).toBe('SILVER');
    expect(
      await VerificationRequestModel.countDocuments({ status: VerificationStatus.APPROVED }),
    ).toBe(1);
    expect(await ActivityLogModel.countDocuments({ event: 'VERIFICATION_REQUEST_CREATED' })).toBe(
      1,
    );
    expect(await NotificationModel.countDocuments({ type: 'VERIFICATION_REVIEWED' })).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'VERIFICATION_REVIEWED' })).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'VERIFICATION_DOCUMENT_PREVIEWED' })).toBe(
      1,
    );

    await request(app)
      .patch(`/api/admin/verifications/${created.request._id}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: VerificationStatus.REJECTED })
      .expect(200);
    const downgradedProfile = await ProfileModel.findOne({ userId: member.user._id }).orFail();
    expect(downgradedProfile.verification.identityVerified).toBe(false);
    expect(downgradedProfile.verification.level).toBe('BASIC');

    downgradedProfile.verification.level = 'FULLY_VERIFIED';
    await downgradedProfile.save();
    await request(app)
      .post('/api/admin/verifications/recalculate-badges')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect((await ProfileModel.findById(profile._id).orFail()).verification.level).toBe('BASIC');
  });

  it('applies moderation dashboard report actions', async () => {
    const admin = await createUser('moderation-actions@example.com', UserRole.ADMIN);
    const member = await createUser('reported-member@example.com');
    const room = await CommunityRoomModel.create({
      slug: 'moderation-room',
      name: 'Moderation Room',
      isDefault: false,
    });
    const post = await CommunityPostModel.create({
      roomId: room._id,
      authorId: member.user._id,
      body: 'Reported community post.',
      status: 'PUBLISHED',
    });
    const report = await ReportModel.create({
      reporterId: admin.user._id,
      reportedUserId: member.user._id,
      targetType: 'COMMUNITY_POST',
      targetId: post._id,
      reason: 'This community post needs moderation.',
      status: 'OPEN',
      severity: 'HIGH',
    });

    await request(app)
      .patch(`/api/admin/moderation/reports/${report.id}/action`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ action: 'REMOVE_CONTENT' })
      .expect(200);

    expect((await CommunityPostModel.findById(post._id).orFail()).status).toBe('REMOVED');
    expect(await AuditLogModel.countDocuments({ action: 'MODERATION_REMOVE_CONTENT' })).toBe(1);

    const secondReport = await ReportModel.create({
      reporterId: admin.user._id,
      reportedUserId: member.user._id,
      targetType: 'USER',
      reason: 'This member should be suspended after review.',
      status: 'OPEN',
      severity: 'HIGH',
    });
    await request(app)
      .patch(`/api/admin/moderation/reports/${secondReport.id}/action`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ action: 'SUSPEND' })
      .expect(200);
    expect((await UserModel.findById(member.user._id).orFail()).status).toBe(
      AccountStatus.SUSPENDED,
    );
  });

  it('lists audit logs for admins', async () => {
    const admin = await createUser('audit-admin@example.com', UserRole.ADMIN);
    await AuditLogModel.create({
      actorId: admin.user._id,
      actorRole: UserRole.ADMIN,
      action: 'ADMIN_USER_UPDATED',
      targetType: 'USER',
    });

    const response = await request(app)
      .get('/api/admin/audit-logs?action=ADMIN_USER_UPDATED')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(bodyAs<{ logs: Array<{ action: string }> }>(response).logs[0]?.action).toBe(
      'ADMIN_USER_UPDATED',
    );
  });
});
