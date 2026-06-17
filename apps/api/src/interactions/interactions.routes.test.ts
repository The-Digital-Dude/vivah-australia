import request from 'supertest';
import type { Response } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, Gender, InterestStatus, SubscriptionStatus, UserRole } from '@vivah/shared';
import { createApp } from '../app.js';
import { createTokenPair } from '../auth/token.service.js';
import type { AuthConfig } from '../auth/auth-types.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  BlockModel,
  CommunityCommentModel,
  CommunityPostModel,
  ConversationModel,
  FavouriteModel,
  FraudEventModel,
  HiddenProfileModel,
  InterestModel,
  MessageModel,
  MonthlyInterestCounterModel,
  NotificationModel,
  PlanModel,
  ProfileMediaModel,
  ProfileApprovalStatus,
  ProfileModel,
  ReportModel,
  SubscriptionModel,
  UserModel,
  type ProfileMediaDocument,
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

const app = createApp({
  corsOrigins: ['http://localhost:3000'],
  auth: authConfig,
});

let mongoServer: MongoMemoryServer;

function bodyAs<TBody>(response: Response): TBody {
  return response.body as TBody;
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

async function createProfile(
  userId: mongoose.Types.ObjectId,
  displayId: string,
  firstName: string,
  gender: (typeof Gender)[keyof typeof Gender],
) {
  const profile: ProfileDocument = await ProfileModel.create({
    userId,
    displayId,
    completionPercentage: 100,
    personal: {
      firstName,
      lastName: 'Member',
      gender,
      age: 30,
      dateOfBirth: new Date('1995-01-01'),
      maritalStatus: 'NEVER_MARRIED',
    },
    religion: { religion: 'Hindu', community: 'Indian', languagesSpoken: ['English'] },
    location: { country: 'Australia', state: 'VIC', city: 'Melbourne' },
    education: { highestQualification: 'Bachelor degree' },
    employment: { occupation: 'Engineer', annualIncomeVisibility: 'PRIVATE' },
    family: {},
    lifestyle: {},
    about: {
      aboutMe: `${firstName} has a complete approved test profile.`,
      partnerExpectations: 'Looking for a respectful long-term match.',
    },
    partnerPreference: {},
    verification: {
      level: 'BASIC',
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
    moderation: { approvalStatus: ProfileApprovalStatus.APPROVED },
    userStatus: AccountStatus.ACTIVE,
    userIsDeleted: false,
  });
  return profile;
}

async function premiumUser(email: string) {
  const created = await createUser(email);
  const plan = await PlanModel.create({
    code: 'PREMIUM',
    name: 'Premium',
    priceCents: 4900,
    currency: 'AUD',
    interval: 'MONTH',
    features: ['More interests'],
    limits: { interestsPerMonth: 50 },
    active: true,
  });
  await SubscriptionModel.create({
    userId: created.user._id,
    planId: plan._id,
    status: SubscriptionStatus.ACTIVE,
    startsAt: new Date(Date.now() - 1000),
  });
  return created;
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

describe('interaction routes', () => {
  it('sends, rejects duplicates, accepts, withdraws, and creates notifications', async () => {
    const sender = await createUser('sender@example.com');
    const receiver = await createUser('receiver@example.com');
    await createProfile(sender.user._id, 'VA300001', 'Amit', Gender.MALE);
    const receiverProfile = await createProfile(
      receiver.user._id,
      'VA300002',
      'Priya',
      Gender.FEMALE,
    );

    const sent = await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: receiverProfile.id })
      .expect(201);
    const sentBody = bodyAs<{ interest: { id: string; status: string } }>(sent);

    expect(sentBody.interest.status).toBe(InterestStatus.PENDING);
    await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: receiverProfile.id })
      .expect(409);

    const accepted = await request(app)
      .patch(`/api/interests/${sentBody.interest.id}`)
      .set('Authorization', `Bearer ${receiver.accessToken}`)
      .send({ action: 'ACCEPT' })
      .expect(200);
    expect(bodyAs<{ interest: { status: string } }>(accepted).interest.status).toBe(
      InterestStatus.ACCEPTED,
    );

    expect(
      await NotificationModel.findOne({
        userId: receiver.user._id,
        type: 'INTEREST_RECEIVED',
      }),
    ).toBeTruthy();
    expect(
      await NotificationModel.findOne({
        userId: sender.user._id,
        type: 'INTEREST_ACCEPTED',
      }),
    ).toBeTruthy();
    expect(
      await ConversationModel.findOne({
        participantIds: { $all: [sender.user._id, receiver.user._id] },
        isDeleted: false,
      }),
    ).toBeTruthy();
  });

  it('allows sender to withdraw only pending interests', async () => {
    const sender = await createUser('withdraw-sender@example.com');
    const receiver = await createUser('withdraw-receiver@example.com');
    await createProfile(sender.user._id, 'VA310001', 'Amit', Gender.MALE);
    const receiverProfile = await createProfile(
      receiver.user._id,
      'VA310002',
      'Priya',
      Gender.FEMALE,
    );

    const sent = await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: receiverProfile.id })
      .expect(201);

    const withdrawn = await request(app)
      .patch(`/api/interests/${bodyAs<{ interest: { id: string } }>(sent).interest.id}`)
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ action: 'WITHDRAW' })
      .expect(200);

    expect(bodyAs<{ interest: { status: string } }>(withdrawn).interest.status).toBe(
      InterestStatus.WITHDRAWN,
    );
    expect(
      await NotificationModel.findOne({
        userId: receiver.user._id,
        type: 'INTEREST_WITHDRAWN',
      }),
    ).toBeTruthy();
  });

  it('enforces blocked-user rules and free monthly interest limits', async () => {
    const sender = await createUser('limited@example.com');
    const blocked = await createUser('blocked@example.com');
    await createProfile(sender.user._id, 'VA320001', 'Amit', Gender.MALE);
    const blockedProfile = await createProfile(
      blocked.user._id,
      'VA320002',
      'Priya',
      Gender.FEMALE,
    );
    await BlockModel.create({ blockerId: blocked.user._id, blockedId: sender.user._id });

    await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: blockedProfile.id })
      .expect(403);

    for (let index = 0; index < 5; index += 1) {
      const target = await createUser(`target-${index}@example.com`);
      const profile = await createProfile(
        target.user._id,
        `VA32001${index}`,
        `Target${index}`,
        Gender.FEMALE,
      );
      await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${sender.accessToken}`)
        .send({ profileId: profile.id })
        .expect(201);
    }

    const finalTarget = await createUser('target-final@example.com');
    const finalProfile = await createProfile(
      finalTarget.user._id,
      'VA320099',
      'Final',
      Gender.FEMALE,
    );
    await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: finalProfile.id })
      .expect(403);
  });

  it('releases monthly quota after rejection and block-driven withdrawal', async () => {
    const sender = await createUser('quota-sender@example.com');
    const receiver = await createUser('quota-receiver@example.com');
    const blocker = await createUser('quota-blocker@example.com');
    await createProfile(sender.user._id, 'VA320201', 'Amit', Gender.MALE);
    const receiverProfile = await createProfile(
      receiver.user._id,
      'VA320202',
      'Priya',
      Gender.FEMALE,
    );
    const blockerProfile = await createProfile(
      blocker.user._id,
      'VA320203',
      'Sara',
      Gender.FEMALE,
    );

    const sent = await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: receiverProfile.id })
      .expect(201);

    await request(app)
      .patch(`/api/interests/${bodyAs<{ interest: { id: string } }>(sent).interest.id}`)
      .set('Authorization', `Bearer ${receiver.accessToken}`)
      .send({ action: 'REJECT' })
      .expect(200);

    expect(await MonthlyInterestCounterModel.findOne({ userId: sender.user._id }).lean()).toMatchObject({
      count: 0,
    });
    expect(
      await NotificationModel.findOne({
        userId: sender.user._id,
        type: 'INTEREST_REJECTED',
      }),
    ).toBeTruthy();

    await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: blockerProfile.id })
      .expect(201);

    await request(app)
      .post('/api/me/blocks')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: blockerProfile.id })
      .expect(201);

    expect(await MonthlyInterestCounterModel.findOne({ userId: sender.user._id }).lean()).toMatchObject({
      count: 0,
    });
  });

  it('rejects interests to suspended or deleted targets', async () => {
    const sender = await createUser('safety-sender@example.com');
    const suspended = await createUser('suspended-target@example.com');
    const deleted = await createUser('deleted-target@example.com');
    await createProfile(sender.user._id, 'VA320301', 'Amit', Gender.MALE);
    const suspendedProfile = await createProfile(
      suspended.user._id,
      'VA320302',
      'Riya',
      Gender.FEMALE,
    );
    const deletedProfile = await createProfile(
      deleted.user._id,
      'VA320303',
      'Mina',
      Gender.FEMALE,
    );

    await UserModel.updateOne({ _id: suspended.user._id }, { $set: { status: AccountStatus.SUSPENDED } });
    await UserModel.updateOne({ _id: deleted.user._id }, { $set: { isDeleted: true } });

    await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: suspendedProfile.id })
      .expect(404);

    await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: deletedProfile.id })
      .expect(404);
  });

  it('allows premium members to send more than free interest limit', async () => {
    const sender = await premiumUser('premium-interest@example.com');
    await createProfile(sender.user._id, 'VA330001', 'Amit', Gender.MALE);

    for (let index = 0; index < 6; index += 1) {
      const target = await createUser(`premium-target-${index}@example.com`);
      const profile = await createProfile(
        target.user._id,
        `VA33001${index}`,
        `Target${index}`,
        Gender.FEMALE,
      );
      await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${sender.accessToken}`)
        .send({ profileId: profile.id })
        .expect(201);
    }

    expect(await InterestModel.countDocuments({ senderId: sender.user._id })).toBe(6);
  });

  it('adds, lists, removes favourites, blocks/unblocks, and hides/unhides members', async () => {
    const viewer = await createUser('viewer@example.com');
    const target = await createUser('fav-target@example.com');
    await createProfile(viewer.user._id, 'VA340001', 'Amit', Gender.MALE);
    const targetProfile = await createProfile(target.user._id, 'VA340002', 'Priya', Gender.FEMALE);

    await request(app)
      .post('/api/me/favourites')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({ profileId: targetProfile.id })
      .expect(201);
    await request(app)
      .post('/api/me/favourites')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({ profileId: targetProfile.id })
      .expect(409);

    const favourites = await request(app)
      .get('/api/me/favourites')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);
    expect(bodyAs<{ favourites: unknown[] }>(favourites).favourites).toHaveLength(1);

    await request(app)
      .delete(`/api/me/favourites/${targetProfile.id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(204);
    expect(await FavouriteModel.countDocuments({ userId: viewer.user._id, isDeleted: false })).toBe(
      0,
    );

    await request(app)
      .post('/api/me/blocks')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({ profileId: targetProfile.id })
      .expect(201);
    const blocks = await request(app)
      .get('/api/me/blocks')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);
    expect(bodyAs<{ blocks: unknown[] }>(blocks).blocks).toHaveLength(1);

    await request(app)
      .delete(`/api/me/blocks/${targetProfile.id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(204);
    expect(await BlockModel.countDocuments({ blockerId: viewer.user._id, isDeleted: false })).toBe(
      0,
    );

    await request(app)
      .post('/api/me/hidden-profiles')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({ profileId: targetProfile.id })
      .expect(201);
    const hiddenProfiles = await request(app)
      .get('/api/me/hidden-profiles')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);
    expect(bodyAs<{ hiddenProfiles: unknown[] }>(hiddenProfiles).hiddenProfiles).toHaveLength(1);

    await request(app)
      .delete(`/api/me/hidden-profiles/${targetProfile.id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(204);
    expect(
      await HiddenProfileModel.countDocuments({ userId: viewer.user._id, isDeleted: false }),
    ).toBe(0);
  });

  it('creates reports and safety notification records', async () => {
    const reporter = await createUser('reporter@example.com');
    const target = await createUser('reported@example.com');
    await createProfile(reporter.user._id, 'VA350001', 'Amit', Gender.MALE);
    const targetProfile = await createProfile(target.user._id, 'VA350002', 'Priya', Gender.FEMALE);

    const response = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${reporter.accessToken}`)
      .send({
        targetType: 'PROFILE',
        targetId: targetProfile.id,
        reason: 'This profile appears to be using suspicious information.',
        severity: 'HIGH',
      })
      .expect(201);

    const body = bodyAs<{ report: { status: string; severity: string } }>(response);
    expect(body.report.status).toBe('OPEN');
    expect(body.report.severity).toBe('HIGH');
    expect(await ReportModel.countDocuments({ reporterId: reporter.user._id })).toBe(1);
    expect(
      await NotificationModel.findOne({ userId: reporter.user._id, type: 'REPORT_SUBMITTED' }),
    ).toBeTruthy();
    const riskEvent = await FraudEventModel.findOne({
      userId: target.user._id,
      rule: 'REPORTED_USER_RISK_SCORE',
      isDeleted: false,
    }).lean();
    expect(riskEvent?.status).toBe('OPEN');
    expect(riskEvent?.metadata).toMatchObject({ activeReportCount: 1, highestSeverity: 'HIGH' });
  });

  it('blocks immediate resend after rejection for the same member pair', async () => {
    const sender = await createUser('rejection-sender@example.com');
    const receiver = await createUser('rejection-receiver@example.com');
    await createProfile(sender.user._id, 'VA355001', 'Amit', Gender.MALE);
    const receiverProfile = await createProfile(receiver.user._id, 'VA355002', 'Priya', Gender.FEMALE);

    const sent = await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: receiverProfile.id })
      .expect(201);

    await request(app)
      .patch(`/api/interests/${bodyAs<{ interest: { id: string } }>(sent).interest.id}`)
      .set('Authorization', `Bearer ${receiver.accessToken}`)
      .send({ action: 'REJECT' })
      .expect(200);

    await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: receiverProfile.id })
      .expect(409);
  });

  it('requires real report targets for message, comment, media, and user reports', async () => {
    const reporter = await createUser('report-matrix-reporter@example.com');
    const target = await createUser('report-matrix-target@example.com');
    await createProfile(reporter.user._id, 'VA355101', 'Amit', Gender.MALE);
    const targetProfile = await createProfile(target.user._id, 'VA355102', 'Priya', Gender.FEMALE);

    const conversation = await ConversationModel.create({
      participantIds: [reporter.user._id, target.user._id],
      deletedFor: [],
    });
    const message = await MessageModel.create({
      conversationId: conversation._id,
      senderId: target.user._id,
      body: 'Inappropriate message body',
      attachmentIds: [],
      readBy: [target.user._id],
      deletedFor: [],
      isDeleted: false,
    });
    const post = await CommunityPostModel.create({
      roomId: new mongoose.Types.ObjectId(),
      authorId: target.user._id,
      title: 'Unsafe post',
      body: 'Post body for moderation context',
      status: 'PUBLISHED',
    });
    const comment = await CommunityCommentModel.create({
      postId: post._id,
      authorId: target.user._id,
      body: 'Unsafe comment body',
    });
    const media: ProfileMediaDocument = await ProfileMediaModel.create({
      userId: target.user._id,
      profileId: targetProfile._id,
      assetUrl: 'https://example.com/private-media.jpg',
      mediaType: 'PHOTO',
      category: 'PRIVATE_GALLERY',
      uploadStatus: 'UPLOADED',
      mimeType: 'image/jpeg',
      fileSizeBytes: 12345,
      originalFilename: 'private.jpg',
      visibility: 'PRIVATE',
      approvalStatus: 'APPROVED',
      isPrimary: false,
    });

    await request(app)
      .post(`/api/me/messages/${message.id}/report`)
      .set('Authorization', `Bearer ${reporter.accessToken}`)
      .send({ reason: 'Harassing message', severity: 'HIGH' })
      .expect(201);

    await request(app)
      .post(`/api/community/comments/${comment.id}/report`)
      .set('Authorization', `Bearer ${reporter.accessToken}`)
      .send({ reason: 'Abusive comment' })
      .expect(201);

    await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${reporter.accessToken}`)
      .send({
        targetType: 'MEDIA',
        targetId: media.id,
        reason: 'Private media misuse',
        severity: 'MEDIUM',
      })
      .expect(201);

    await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${reporter.accessToken}`)
      .send({
        targetType: 'USER',
        targetId: target.user.id,
        reason: 'Suspicious member',
        severity: 'LOW',
      })
      .expect(201);

    const reports = await ReportModel.find({ reporterId: reporter.user._id }).lean();
    expect(reports).toHaveLength(4);
    expect(reports.map((report) => report.targetType).sort()).toEqual(['COMMENT', 'MEDIA', 'MESSAGE', 'USER']);
    expect(reports.every((report) => String(report.reportedUserId) === String(target.user._id))).toBe(true);
    expect(reports.every((report) => report.targetSnapshot)).toBe(true);

    await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${reporter.accessToken}`)
      .send({
        targetType: 'USER',
        targetId: new mongoose.Types.ObjectId().toString(),
        reason: 'Missing target',
        severity: 'LOW',
      })
      .expect(404);
  });

  it('allows admins to list, assign, resolve, and dismiss reports', async () => {
    const reporter = await createUser('admin-reporter@example.com');
    const target = await createUser('admin-reported@example.com');
    const admin = await createUser('report-admin@example.com', UserRole.ADMIN);
    await createProfile(reporter.user._id, 'VA360001', 'Amit', Gender.MALE);
    const targetProfile = await createProfile(target.user._id, 'VA360002', 'Priya', Gender.FEMALE);
    const createdReport = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${reporter.accessToken}`)
      .send({
        targetType: 'PROFILE',
        targetId: targetProfile.id,
        reason: 'Needs admin review for suspicious behaviour.',
        severity: 'MEDIUM',
      })
      .expect(201);
    const reportId = bodyAs<{ report: { id: string } }>(createdReport).report.id;

    const list = await request(app)
      .get('/api/admin/reports?status=OPEN')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(bodyAs<{ reports: unknown[] }>(list).reports).toHaveLength(1);
    const firstReport = bodyAs<{
      reports: Array<{ evidence?: unknown; reportedMember?: unknown }>;
    }>(list).reports[0];
    expect(firstReport?.evidence).toEqual(expect.any(Object));
    expect(firstReport?.reportedMember).toEqual(expect.any(Object));

    const assigned = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ action: 'ASSIGN' })
      .expect(200);
    expect(bodyAs<{ report: { status: string } }>(assigned).report.status).toBe('ASSIGNED');

    const resolved = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ action: 'RESOLVE' })
      .expect(200);
    expect(bodyAs<{ report: { status: string } }>(resolved).report.status).toBe('RESOLVED');

    const riskEvent = await FraudEventModel.findOne({
      userId: target.user._id,
      rule: 'REPORTED_USER_RISK_SCORE',
      isDeleted: false,
    }).lean();
    expect(riskEvent?.status).toBe('REVIEWED');
    expect(riskEvent?.score).toBe(0);
    expect(riskEvent?.metadata).toMatchObject({ activeReportCount: 0 });
  });

  it('increments reported-user risk counters across multiple active reports', async () => {
    const target = await createUser('risk-target@example.com');
    await createProfile(target.user._id, 'VA370099', 'Priya', Gender.FEMALE);

    const reporterOne = await createUser('risk-reporter-one@example.com');
    const reporterTwo = await createUser('risk-reporter-two@example.com');
    const reporterThree = await createUser('risk-reporter-three@example.com');
    const targetProfile = await ProfileModel.findOne({ userId: target.user._id }).orFail();

    for (const [accessToken, severity] of [
      [reporterOne.accessToken, 'LOW'],
      [reporterTwo.accessToken, 'MEDIUM'],
      [reporterThree.accessToken, 'CRITICAL'],
    ] as const) {
      await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          targetType: 'PROFILE',
          targetId: targetProfile.id,
          reason: 'This profile requires safety review for suspicious information.',
          severity,
        })
        .expect(201);
    }

    const riskEvent = await FraudEventModel.findOne({
      userId: target.user._id,
      rule: 'REPORTED_USER_RISK_SCORE',
      isDeleted: false,
    }).lean();
    expect(riskEvent?.severity).toBe('CRITICAL');
    expect(riskEvent?.status).toBe('OPEN');
    expect(riskEvent?.score).toBeGreaterThanOrEqual(90);
    expect(riskEvent?.metadata).toMatchObject({
      activeReportCount: 3,
      highestSeverity: 'CRITICAL',
    });
  });

  it('allows moderators to review interest activity and blocks normal members', async () => {
    const sender = await createUser('interest-admin-sender@example.com');
    const receiver = await createUser('interest-admin-receiver@example.com');
    const moderator = await createUser('interest-moderator@example.com', UserRole.MODERATOR);
    await createProfile(sender.user._id, 'VA380001', 'Amit', Gender.MALE);
    const receiverProfile = await createProfile(
      receiver.user._id,
      'VA380002',
      'Priya',
      Gender.FEMALE,
    );

    const created = await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: receiverProfile.id })
      .expect(201);
    const interestId = bodyAs<{ interest: { id: string } }>(created).interest.id;

    const list = await request(app)
      .get('/api/admin/interests?status=PENDING')
      .set('Authorization', `Bearer ${moderator.accessToken}`)
      .expect(200);
    expect(bodyAs<{ results: Array<{ id: string }> }>(list).results.map((item) => item.id)).toContain(
      interestId,
    );

    const detail = await request(app)
      .get(`/api/admin/interests/${interestId}`)
      .set('Authorization', `Bearer ${moderator.accessToken}`)
      .expect(200);
    expect(bodyAs<{ interest: { id: string; sender: { firstName: string } } }>(detail).interest).toMatchObject({
      id: interestId,
      sender: { firstName: 'Amit' },
    });

    await request(app)
      .get('/api/admin/interests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .expect(403);
  });
});
