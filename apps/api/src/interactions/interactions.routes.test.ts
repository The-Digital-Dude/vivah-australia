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
  ConversationModel,
  FavouriteModel,
  InterestModel,
  NotificationModel,
  PlanModel,
  ProfileApprovalStatus,
  ProfileModel,
  ReportModel,
  SubscriptionModel,
  UserModel,
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

async function createProfile(
  userId: mongoose.Types.ObjectId,
  displayId: string,
  firstName: string,
  gender: (typeof Gender)[keyof typeof Gender],
) {
  return ProfileModel.create({
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
  });
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

  it('adds, lists, removes favourites and blocks/unblocks members', async () => {
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
  });

  it('allows admins to list, assign, resolve, and dismiss reports', async () => {
    const reporter = await createUser('admin-reporter@example.com');
    const target = await createUser('admin-reported@example.com');
    const admin = await createUser('report-admin@example.com', UserRole.ADMIN);
    await createProfile(reporter.user._id, 'VA360001', 'Amit', Gender.MALE);
    const targetProfile = await createProfile(target.user._id, 'VA360002', 'Priya', Gender.FEMALE);
    const report = await ReportModel.create({
      reporterId: reporter.user._id,
      reportedUserId: target.user._id,
      targetType: 'PROFILE',
      targetId: targetProfile._id,
      reason: 'Needs admin review for suspicious behaviour.',
      severity: 'MEDIUM',
    });

    const list = await request(app)
      .get('/api/admin/reports?status=OPEN')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(bodyAs<{ reports: unknown[] }>(list).reports).toHaveLength(1);

    const assigned = await request(app)
      .patch(`/api/admin/reports/${report.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ action: 'ASSIGN' })
      .expect(200);
    expect(bodyAs<{ report: { status: string } }>(assigned).report.status).toBe('ASSIGNED');

    const resolved = await request(app)
      .patch(`/api/admin/reports/${report.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ action: 'RESOLVE' })
      .expect(200);
    expect(bodyAs<{ report: { status: string } }>(resolved).report.status).toBe('RESOLVED');
  });
});
