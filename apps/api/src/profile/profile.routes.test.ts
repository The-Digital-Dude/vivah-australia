import request from 'supertest';
import type { Response } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, SubscriptionStatus, UserRole } from '@vivah/shared';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  BlockModel,
  FraudEventModel,
  NotificationModel,
  PlanModel,
  ProfileApprovalStatus,
  ProfileModel,
  ProfileViewModel,
  SubscriptionModel,
  UserModel,
} from '../models/index.js';
import { createTokenPair } from '../auth/token.service.js';
import type { AuthConfig } from '../auth/auth-types.js';

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

interface ProfileResponseBody {
  profile: {
    completionPercentage: number;
    personal: {
      age?: number;
      lastName?: string;
    };
    employment?: {
      annualIncome?: number;
      employerName?: string;
    };
    moderation: {
      approvalStatus: ProfileApprovalStatus;
    };
  };
}

function bodyAs<TBody>(response: Response): TBody {
  return response.body as TBody;
}

async function createUser(email: string) {
  const user = await UserModel.create({
    email,
    authProviders: ['email'],
    role: UserRole.USER,
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

async function createProfile(userId: mongoose.Types.ObjectId, displayId = 'VA123456') {
  return ProfileModel.create({
    userId,
    displayId,
    completionPercentage: 0,
    personal: { firstName: 'Amit', lastName: 'Sharma' },
    religion: { languagesSpoken: [] },
    location: {},
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

async function addPremiumSubscription(userId: mongoose.Types.ObjectId) {
  const plan = await PlanModel.create({
    code: 'PREMIUM',
    name: 'Premium',
    priceCents: 4900,
    currency: 'AUD',
    interval: 'MONTH',
    features: ['Who viewed my profile'],
    limits: { profileViewers: 50 },
    active: true,
  });

  await SubscriptionModel.create({
    userId,
    planId: plan._id,
    status: SubscriptionStatus.ACTIVE,
    startsAt: new Date(Date.now() - 1000),
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

describe('profile routes', () => {
  it('partially saves profile data and updates completion percentage', async () => {
    const { user, accessToken } = await createUser('member@example.com');
    await createProfile(user._id);

    const response = await request(app)
      .patch('/api/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        personal: {
          gender: 'MALE',
          dateOfBirth: '1992-04-12',
          maritalStatus: 'NEVER_MARRIED',
        },
        location: { country: 'Australia', city: 'Melbourne' },
        religion: { religion: 'Hindu', community: 'Indian' },
      })
      .expect(200);

    const body = bodyAs<ProfileResponseBody>(response);

    expect(body.profile.completionPercentage).toBeGreaterThan(30);
    expect(body.profile.personal.age).toBeGreaterThanOrEqual(18);
  });

  it('rejects invalid underage date of birth', async () => {
    const { user, accessToken } = await createUser('young@example.com');
    await createProfile(user._id);

    await request(app)
      .patch('/api/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ personal: { dateOfBirth: '2015-01-01' } })
      .expect(400);
  });

  it('submits a complete profile for moderation', async () => {
    const { user, accessToken } = await createUser('submit@example.com');
    await createProfile(user._id);

    await request(app)
      .patch('/api/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        personal: {
          firstName: 'Priya',
          lastName: 'Patel',
          gender: 'FEMALE',
          dateOfBirth: '1994-08-23',
          maritalStatus: 'NEVER_MARRIED',
        },
        location: { country: 'Australia', city: 'Sydney' },
        religion: { religion: 'Hindu', community: 'Indian' },
        education: { highestQualification: 'Bachelor degree' },
        employment: { occupation: 'Accountant' },
        about: {
          aboutMe: 'I am a committed professional looking for a serious long-term match.',
          partnerExpectations: 'I value kindness, family connection, and shared goals.',
        },
      })
      .expect(200);

    const response = await request(app)
      .post('/api/me/profile/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ confirm: true })
      .expect(200);

    const body = bodyAs<ProfileResponseBody>(response);

    expect(body.profile.moderation.approvalStatus).toBe(ProfileApprovalStatus.PENDING);
    expect(body.profile.completionPercentage).toBe(100);
  });

  it('applies privacy controls on profile view', async () => {
    const { user } = await createUser('visible@example.com');
    const profile = await createProfile(user._id);
    profile.set({
      'personal.gender': 'MALE',
      'personal.dateOfBirth': new Date('1991-01-01'),
      'personal.age': 35,
      'personal.maritalStatus': 'NEVER_MARRIED',
      'location.country': 'Australia',
      'location.city': 'Perth',
      'employment.occupation': 'Engineer',
      'employment.annualIncome': 120000,
      'employment.employerName': 'Private Co',
      'about.aboutMe': 'A complete approved profile for privacy checks.',
      'about.partnerExpectations': 'A respectful partner with shared values.',
      'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
      'visibility.status': 'PUBLIC',
      'visibility.showLastName': false,
      'visibility.showIncome': false,
      'visibility.showEmployer': false,
    });
    await profile.save();

    const response = await request(app).get(`/api/profiles/${profile.id}`).expect(200);

    const body = bodyAs<ProfileResponseBody>(response);

    expect(body.profile.personal.lastName).toBeUndefined();
    expect(body.profile.employment?.annualIncome).toBeUndefined();
    expect(body.profile.employment?.employerName).toBeUndefined();
  });

  it('serves approved public profiles by slug', async () => {
    const { user } = await createUser('slug-visible@example.com');
    const profile = await createProfile(user._id, 'VA100001');
    profile.set({
      slug: 'amit-sharma-va100001',
      'personal.gender': 'MALE',
      'personal.age': 34,
      'location.city': 'Melbourne',
      'employment.occupation': 'Engineer',
      'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
      'visibility.status': 'PUBLIC',
    });
    await profile.save();

    const response = await request(app).get('/api/profiles/amit-sharma-va100001').expect(200);

    expect(
      bodyAs<{ profile: { displayId: string; slug: string } }>(response).profile,
    ).toMatchObject({
      displayId: 'VA100001',
      slug: 'amit-sharma-va100001',
    });
  });

  it('blocks profile viewing when either user has blocked the other', async () => {
    const { user, accessToken } = await createUser('viewer@example.com');
    const owner = await createUser('owner@example.com');
    const profile = await createProfile(owner.user._id, 'VA654321');
    profile.set({
      'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
      'visibility.status': 'MEMBERS_ONLY',
    });
    await profile.save();
    await BlockModel.create({ blockerId: owner.user._id, blockedId: user._id });

    await request(app)
      .get(`/api/profiles/${profile.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('stores recently viewed profiles and flags high velocity viewing', async () => {
    const viewer = await createUser('recent-viewer@example.com');
    const owner = await createUser('recent-owner@example.com');
    const profile = await createProfile(owner.user._id, 'VA777001');
    profile.set({
      'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
      'visibility.status': 'MEMBERS_ONLY',
    });
    await profile.save();

    await request(app)
      .get(`/api/profiles/${profile.id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    const recentResponse = await request(app)
      .get('/api/me/recently-viewed')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);
    expect(
      bodyAs<{ items: Array<{ profile: { displayId: string } }> }>(recentResponse).items[0],
    ).toMatchObject({ profile: { displayId: 'VA777001' } });
    expect(await ProfileViewModel.countDocuments({ viewerId: viewer.user._id })).toBe(1);

    const owners = await Promise.all(
      Array.from({ length: 20 }, async (_, index) => {
        const nextOwner = await createUser(`velocity-owner-${index}@example.com`);
        const nextProfile = await createProfile(
          nextOwner.user._id,
          `VA88${String(index).padStart(4, '0')}`,
        );
        nextProfile.set({
          'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
          'visibility.status': 'MEMBERS_ONLY',
        });
        await nextProfile.save();
        return nextProfile;
      }),
    );
    for (const nextProfile of owners) {
      await request(app)
        .get(`/api/profiles/${nextProfile.id}`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(200);
    }
    expect(await FraudEventModel.countDocuments({ userId: viewer.user._id })).toBe(1);
  });

  it('creates a paid-only profile view notification with viewer payload', async () => {
    const viewer = await createUser('notify-viewer@example.com');
    const owner = await createUser('notify-owner@example.com');
    await addPremiumSubscription(owner.user._id);

    const viewerProfile = await createProfile(viewer.user._id, 'VA990001');
    viewerProfile.set({
      'personal.firstName': 'Priya',
      'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
      'visibility.status': 'MEMBERS_ONLY',
    });
    await viewerProfile.save();

    const ownerProfile = await createProfile(owner.user._id, 'VA990002');
    ownerProfile.set({
      'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
      'visibility.status': 'MEMBERS_ONLY',
    });
    await ownerProfile.save();

    await request(app)
      .get(`/api/profiles/${ownerProfile.id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    const notification = await NotificationModel.findOne({
      userId: owner.user._id,
      type: 'PROFILE_VIEWED',
      isDeleted: false,
    }).lean();

    expect(notification).toBeTruthy();
    expect(notification?.title).toBe('Priya viewed your profile');
    expect(notification?.body).toBe('See who viewed your profile and continue the conversation.');
    expect(notification?.data).toMatchObject({
      viewerUserId: String(viewer.user._id),
      viewerProfileId: String(viewerProfile._id),
      viewerDisplayId: viewerProfile.displayId,
      viewedProfileId: ownerProfile.id,
    });
    expect(typeof (notification?.data as { viewedAt?: unknown } | undefined)?.viewedAt).toBe(
      'string',
    );
  });

  it('does not create a profile view notification for free recipients', async () => {
    const viewer = await createUser('free-viewer@example.com');
    const owner = await createUser('free-owner@example.com');

    const viewerProfile = await createProfile(viewer.user._id, 'VA991001');
    viewerProfile.set('moderation.approvalStatus', ProfileApprovalStatus.APPROVED);
    await viewerProfile.save();

    const ownerProfile = await createProfile(owner.user._id, 'VA991002');
    ownerProfile.set('moderation.approvalStatus', ProfileApprovalStatus.APPROVED);
    await ownerProfile.save();

    await request(app)
      .get(`/api/profiles/${ownerProfile.id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(
      await NotificationModel.countDocuments({
        userId: owner.user._id,
        type: 'PROFILE_VIEWED',
        isDeleted: false,
      }),
    ).toBe(0);
  });

  it('does not create a profile view notification on self-view', async () => {
    const member = await createUser('self-view@example.com');
    await addPremiumSubscription(member.user._id);

    const profile = await createProfile(member.user._id, 'VA991500');
    profile.set('moderation.approvalStatus', ProfileApprovalStatus.APPROVED);
    await profile.save();

    await request(app)
      .get(`/api/profiles/${profile.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(200);

    expect(
      await NotificationModel.countDocuments({
        userId: member.user._id,
        type: 'PROFILE_VIEWED',
        isDeleted: false,
      }),
    ).toBe(0);
  });

  it('deduplicates repeated profile view notifications for 24 hours and allows later re-notify', async () => {
    const viewer = await createUser('repeat-viewer@example.com');
    const owner = await createUser('repeat-owner@example.com');
    await addPremiumSubscription(owner.user._id);

    const viewerProfile = await createProfile(viewer.user._id, 'VA992001');
    viewerProfile.set({
      'personal.firstName': 'Neha',
      'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
    });
    await viewerProfile.save();

    const ownerProfile = await createProfile(owner.user._id, 'VA992002');
    ownerProfile.set('moderation.approvalStatus', ProfileApprovalStatus.APPROVED);
    await ownerProfile.save();

    await request(app)
      .get(`/api/profiles/${ownerProfile.id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);
    await request(app)
      .get(`/api/profiles/${ownerProfile.id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(
      await NotificationModel.countDocuments({
        userId: owner.user._id,
        type: 'PROFILE_VIEWED',
        isDeleted: false,
      }),
    ).toBe(1);

    await NotificationModel.collection.updateOne(
      { userId: owner.user._id, type: 'PROFILE_VIEWED', isDeleted: false },
      { $set: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } },
    );

    await request(app)
      .get(`/api/profiles/${ownerProfile.id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(
      await NotificationModel.countDocuments({
        userId: owner.user._id,
        type: 'PROFILE_VIEWED',
        isDeleted: false,
      }),
    ).toBe(2);
    expect(await ProfileViewModel.countDocuments({ viewerId: viewer.user._id })).toBe(1);
  });
});
