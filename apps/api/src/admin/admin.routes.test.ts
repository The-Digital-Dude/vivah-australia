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
  AuthTokenModel,
  AuditLogModel,
  BannerModel,
  BlogPostModel,
  CmsPageModel,
  CommunityPostModel,
  CommunityRoomModel,
  NotificationModel,
  PlanModel,
  ProfileBoostModel,
  ProfileApprovalStatus,
  ProfileModel,
  ReportModel,
  SuccessStoryModel,
  SubscriptionModel,
  SystemSettingModel,
  TestimonialModel,
  UserModel,
  VerificationDocumentModel,
  VerificationRequestModel,
  type ProfileDocument,
  type UserDocument,
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

async function createUser(
  email: string,
  role = UserRole.USER,
): Promise<{ user: UserDocument; accessToken: string }> {
  const user: UserDocument = await UserModel.create({
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
    refreshTokenVersion: 0,
  }).accessToken;
  return { user, accessToken };
}

async function createProfile(userId: mongoose.Types.ObjectId) {
  const profile: ProfileDocument = await ProfileModel.create({
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
  return profile;
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
    const memberProfile = await createProfile(member.user._id);
    await ReportModel.create({
      reporterId: member.user._id,
      targetType: 'USER',
      reason: 'Suspicious profile needs review.',
      status: 'OPEN',
      severity: 'LOW',
    });
    const boost = await ProfileBoostModel.create({
      userId: member.user._id,
      profileId: memberProfile._id,
      source: 'ENTITLEMENT',
      startsAt: new Date('2026-06-10T00:00:00.000Z'),
      endsAt: new Date('2026-06-20T00:00:00.000Z'),
      active: true,
    });
    await ProfileBoostModel.collection.updateOne(
      { _id: boost._id },
      { $set: { createdAt: new Date('2026-06-10T00:00:00.000Z') } },
    );

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
      bodyAs<{
        matchInterestStats: unknown[];
        messagingActivity: unknown[];
        boostSourceStats: Array<{ _id: string; count: number }>;
        activeBoostCount: number;
      }>(analyticsResponse).matchInterestStats,
    ).toEqual(expect.any(Array));
    expect(
      bodyAs<{
        boostSourceStats: Array<{ _id: string; count: number }>;
        activeBoostCount: number;
      }>(analyticsResponse).boostSourceStats,
    ).toContainEqual(expect.objectContaining({ _id: 'ENTITLEMENT', count: 1 }));
    expect(
      bodyAs<{ activeBoostCount: number }>(analyticsResponse).activeBoostCount,
    ).toBeGreaterThanOrEqual(1);

    const csvResponse = await request(app)
      .get('/api/admin/analytics/export.csv?from=2026-06-01T00:00:00.000Z&to=2026-06-17T23:59:59.999Z')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(csvResponse.text).toContain('section,key,count,totalCents');
    expect(csvResponse.text).toContain('"boostSourceStats","ENTITLEMENT","1",""');
    expect(csvResponse.text).toContain('activeBoostCount,LIVE,');
    const analyticsRange = bodyAs<{ range: { from: string; to: string } }>(analyticsResponse).range;
    expect(typeof analyticsRange.from).toBe('string');
    expect(typeof analyticsRange.to).toBe('string');
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

  it('filters users by active subscription tier and joined date range', async () => {
    const admin = await createUser('admin-filters@example.com', UserRole.ADMIN);
    const included = await createUser('plan-included@example.com');
    const excludedByPlan = await createUser('plan-excluded@example.com');
    const excludedByDate = await createUser('date-excluded@example.com');

    const includedProfile = await createProfile(included.user._id);
    await ProfileModel.updateOne(
      { _id: includedProfile._id },
      { $set: { 'verification.level': 'SILVER' } },
    );
    const excludedByPlanProfile = await createProfile(excludedByPlan.user._id);
    await ProfileModel.updateOne(
      { _id: excludedByPlanProfile._id },
      { $set: { 'verification.level': 'SILVER' } },
    );
    const excludedByDateProfile = await createProfile(excludedByDate.user._id);
    await ProfileModel.updateOne(
      { _id: excludedByDateProfile._id },
      { $set: { 'verification.level': 'SILVER' } },
    );

    const goldPlan = await PlanModel.create({
      code: 'gold-admin-filter',
      name: 'Gold',
      description: 'Gold tier',
      priceCents: 4900,
      currency: 'AUD',
      interval: 'MONTH',
      features: ['Priority support'],
      limits: { interestsMonthly: -1 },
      stripePriceId: 'price_gold_admin_filter',
      sortOrder: 1,
      active: true,
    });
    const silverPlan = await PlanModel.create({
      code: 'silver-admin-filter',
      name: 'Silver',
      description: 'Silver tier',
      priceCents: 2900,
      currency: 'AUD',
      interval: 'MONTH',
      features: ['Extra views'],
      limits: { interestsMonthly: 25 },
      stripePriceId: 'price_silver_admin_filter',
      sortOrder: 2,
      active: true,
    });

    await SubscriptionModel.create([
      {
        userId: included.user._id,
        planId: goldPlan._id,
        status: 'ACTIVE',
        startsAt: new Date('2025-02-01T00:00:00.000Z'),
        currentPeriodStart: new Date('2025-02-01T00:00:00.000Z'),
        currentPeriodEnd: new Date('2025-03-01T00:00:00.000Z'),
        cancelAtPeriodEnd: false,
      },
      {
        userId: excludedByPlan.user._id,
        planId: silverPlan._id,
        status: 'ACTIVE',
        startsAt: new Date('2025-02-01T00:00:00.000Z'),
        currentPeriodStart: new Date('2025-02-01T00:00:00.000Z'),
        currentPeriodEnd: new Date('2025-03-01T00:00:00.000Z'),
        cancelAtPeriodEnd: false,
      },
      {
        userId: excludedByDate.user._id,
        planId: goldPlan._id,
        status: 'ACTIVE',
        startsAt: new Date('2024-12-01T00:00:00.000Z'),
        currentPeriodStart: new Date('2024-12-01T00:00:00.000Z'),
        currentPeriodEnd: new Date('2025-01-01T00:00:00.000Z'),
        cancelAtPeriodEnd: false,
      },
    ]);

    await UserModel.collection.updateOne(
      { _id: included.user._id },
      { $set: { createdAt: new Date('2025-02-10T09:00:00.000Z') } },
    );
    await UserModel.collection.updateOne(
      { _id: excludedByPlan.user._id },
      { $set: { createdAt: new Date('2025-02-12T09:00:00.000Z') } },
    );
    await UserModel.collection.updateOne(
      { _id: excludedByDate.user._id },
      { $set: { createdAt: new Date('2024-12-20T09:00:00.000Z') } },
    );

    const response = await request(app)
      .get('/api/admin/users')
      .query({
        planId: String(goldPlan._id),
        verificationLevel: 'SILVER',
        joinedFrom: '2025-02-01T00:00:00.000Z',
        joinedTo: '2025-02-28T23:59:59.999Z',
      })
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const body = bodyAs<{ users: Array<{ id: string }> }>(response);
    expect(body.users).toHaveLength(1);
    expect(body.users[0]?.id).toBe(included.user.id);
  });

  it('revokes active sessions and auth tokens when an admin suspends a user', async () => {
    const admin = await createUser('admin-revoke@example.com', UserRole.ADMIN);
    const member = await createUser('member-revoke@example.com');
    member.user.activeSessions = ['refresh-session-1', 'refresh-session-2'];
    await member.user.save();
    await AuthTokenModel.create({
      userId: member.user._id,
      purpose: 'PASSWORD_RESET',
      tokenHash: 'hashed-reset-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await request(app)
      .patch(`/api/admin/users/${member.user.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: AccountStatus.SUSPENDED })
      .expect(200);

    const updated = await UserModel.findById(member.user._id).orFail();
    expect(updated.activeSessions).toHaveLength(0);
    expect(await AuthTokenModel.countDocuments({ userId: member.user._id })).toBe(0);
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

    const uploadResponse = await request(app)
      .post('/api/me/verification-documents/sign-upload')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        documentType: 'Passport',
        fileName: 'passport.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 100000,
      })
      .expect(201);
    const signed = bodyAs<{
      document: { id: string };
      upload: { url: string; fields: Record<string, string> };
    }>(uploadResponse);

    await request(app)
      .put(`/api/mock-gcs-storage/${signed.upload.fields.storageKey}`)
      .set('Content-Type', 'image/jpeg')
      .send('passport-bytes')
      .expect(200);

    await request(app)
      .post('/api/me/verification-documents/complete')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        documentId: signed.document.id,
        assetUrl: signed.upload.url,
        storageKey: signed.upload.fields.storageKey,
        bytes: 100000,
      })
      .expect(200);

    const createResponse = await request(app)
      .post('/api/me/verifications')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ type: 'IDENTITY', documentType: 'Passport', documentId: signed.document.id })
      .expect(201);

    const created = bodyAs<{
      request: { _id: string; provider: string; providerReferenceId: string };
    }>(createResponse);
    expect(created.request.provider).toBe('manual-review');
    expect(created.request.providerReferenceId).toMatch(
      new RegExp(`^manual-identity-${created.request._id}-`),
    );

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
      .get(`/api/admin/verifications/${created.request._id}/documents/${documentId}/access`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    const preview = bodyAs<{ preview: { previewUrl: string } }>(
      await request(app)
        .get(`/api/admin/verifications/${created.request._id}/documents/${documentId}/access`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200),
    ).preview;

    await request(app)
      .get(new URL(preview.previewUrl).pathname + new URL(preview.previewUrl).search)
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
    const storedRequest = await VerificationRequestModel.findById(created.request._id).lean();
    expect(storedRequest?.provider).toBe('manual-review');
    expect(storedRequest?.providerReferenceId).toMatch(
      new RegExp(`^manual-identity-${created.request._id}-`),
    );
    const storedDocument = await VerificationDocumentModel.findById(documentId).lean();
    expect(String(storedDocument?.requestId)).toBe(created.request._id);
    expect(await ActivityLogModel.countDocuments({ event: 'VERIFICATION_REQUEST_CREATED' })).toBe(
      1,
    );
    expect(await NotificationModel.countDocuments({ type: 'VERIFICATION_REVIEWED' })).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'VERIFICATION_REVIEWED' })).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'VERIFICATION_DOCUMENT_PREVIEWED' })).toBe(
      2,
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

  it('creates and serves CMS pages through admin CRUD and public fetch', async () => {
    const admin = await createUser('admin-cms-pages@example.com', UserRole.ADMIN);
    const createResponse = await request(app)
      .post('/api/admin/cms/pages')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        slug: 'about-us',
        title: 'About Us',
        body: 'Published CMS page.',
        published: true,
      })
      .expect(201);

    const publicResponse = await request(app).get('/api/public/pages/about-us').expect(200);
    expect(bodyAs<{ page: { title: string } }>(publicResponse).page.title).toBe('About Us');

    const listResponse = await request(app)
      .get('/api/admin/cms/pages')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(bodyAs<{ pages: Array<{ slug: string }> }>(listResponse).pages).toContainEqual(
      expect.objectContaining({ slug: 'about-us' }),
    );

    await request(app)
      .patch(`/api/admin/cms/pages/${bodyAs<{ page: { _id: string } }>(createResponse).page._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'About Vivah Australia' })
      .expect(200);

    const storedPage: unknown = await CmsPageModel.findOne({ slug: 'about-us' })
      .select('title')
      .lean()
      .orFail();
    expect(
      typeof storedPage === 'object' &&
        storedPage !== null &&
        'title' in storedPage &&
        typeof storedPage.title === 'string'
        ? storedPage.title
        : undefined,
    ).toBe('About Vivah Australia');
  });

  it('manages homepage and CMS content collections from admin APIs', async () => {
    const admin = await createUser('admin-cms-home@example.com', UserRole.ADMIN);

    await request(app)
      .put('/api/admin/cms/home')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        hero: {
          title: 'Vivah Australia',
          subtitle: 'Premium introductions for serious Australian members.',
          primaryAction: 'Create profile',
          secondaryAction: 'View plans',
        },
        howItWorks: ['Create profile', 'Verify details'],
        safety: ['Manual moderation', 'Private media'],
        faq: [{ question: 'Can admins update FAQs?', answer: 'Yes, from the CMS.' }],
        contact: { email: 'support@vivahaustralia.com.au', location: 'Australia' },
      })
      .expect(200);

    const homeResponse = await request(app).get('/api/public/home').expect(200);
    expect(bodyAs<{ hero: { subtitle: string } }>(homeResponse).hero.subtitle).toContain(
      'Premium introductions',
    );

    await request(app)
      .post('/api/admin/cms/blogs')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        slug: 'profile-guide',
        title: 'Profile guide',
        body: 'Useful profile guidance.',
        published: true,
      })
      .expect(201);

    await request(app)
      .post('/api/admin/cms/success-stories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        slug: 'melbourne-match',
        title: 'Melbourne match',
        body: 'A thoughtful family introduction.',
        coupleName: 'A & P',
        published: true,
      })
      .expect(201);

    await request(app)
      .post('/api/admin/cms/testimonials')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Member family',
        quote: 'The service felt considered.',
        published: true,
      })
      .expect(201);

    await request(app)
      .post('/api/admin/cms/banners')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        key: 'homepage-hero',
        title: 'Homepage hero',
        imageUrl: 'https://example.com/hero.jpg',
        active: true,
      })
      .expect(201);

    await request(app)
      .get('/api/admin/cms/blogs')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    await request(app)
      .get('/api/admin/cms/success-stories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    await request(app)
      .get('/api/admin/cms/testimonials')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    await request(app)
      .get('/api/admin/cms/banners')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    await expect(
      SystemSettingModel.findOne({ key: 'homepageContent' }).orFail(),
    ).resolves.toBeTruthy();
    await expect(BlogPostModel.findOne({ slug: 'profile-guide' }).orFail()).resolves.toBeTruthy();
    await expect(
      SuccessStoryModel.findOne({ slug: 'melbourne-match' }).orFail(),
    ).resolves.toBeTruthy();
    await expect(
      TestimonialModel.findOne({ name: 'Member family' }).orFail(),
    ).resolves.toBeTruthy();
    await expect(BannerModel.findOne({ key: 'homepage-hero' }).orFail()).resolves.toBeTruthy();
  });
});
