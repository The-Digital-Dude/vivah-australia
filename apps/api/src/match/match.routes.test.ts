import request from 'supertest';
import type { Response } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, Gender, SubscriptionStatus, UserRole } from '@vivah/shared';
import { createApp } from '../app.js';
import { createTokenPair } from '../auth/token.service.js';
import type { AuthConfig } from '../auth/auth-types.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  BlockModel,
  HiddenProfileModel,
  PlanModel,
  ProfileApprovalStatus,
  ProfileModel,
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

interface MatchResponseBody {
  results: Array<{
    id: string;
    firstName?: string;
    city?: string;
    matchScore: number;
    matchReasons: string[];
  }>;
  pagination?: {
    pageSize: number;
    total: number;
  };
  limits: {
    planCode: string;
    searchPageSize: number;
    recommendationLimit: number;
  };
}

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

async function createProfile({
  userId,
  displayId,
  firstName,
  gender,
  age,
  city = 'Melbourne',
  state = 'VIC',
  approvalStatus = ProfileApprovalStatus.APPROVED,
  visibilityStatus = 'MEMBERS_ONLY',
  completionPercentage = 100,
  verificationLevel = 'BASIC',
  lastActiveAt = new Date(),
  activeBoostEndsAt,
}: {
  userId: mongoose.Types.ObjectId;
  displayId: string;
  firstName: string;
  gender: (typeof Gender)[keyof typeof Gender];
  age: number;
  city?: string;
  state?: string;
  approvalStatus?: ProfileApprovalStatus;
  visibilityStatus?: 'PUBLIC' | 'MEMBERS_ONLY' | 'MATCHES_ONLY' | 'HIDDEN';
  completionPercentage?: number;
  verificationLevel?: string;
  lastActiveAt?: Date;
  activeBoostEndsAt?: Date;
}) {
  return ProfileModel.create({
    userId,
    displayId,
    completionPercentage,
    personal: {
      firstName,
      lastName: 'Test',
      gender,
      age,
      dateOfBirth: new Date(`${new Date().getFullYear() - age}-01-01`),
      heightCm: 168,
      maritalStatus: 'NEVER_MARRIED',
    },
    religion: {
      religion: 'Hindu',
      community: 'Indian',
      motherTongue: 'Hindi',
      languagesSpoken: ['English', 'Hindi'],
    },
    location: { country: 'Australia', state, city },
    education: { highestQualification: 'Bachelor degree' },
    employment: {
      occupation: 'Engineer',
      annualIncome: 120000,
      annualIncomeVisibility: 'PRIVATE',
    },
    family: { familyValues: 'Moderate' },
    lifestyle: {
      dietaryPreferences: 'Vegetarian',
      smokingHabits: 'Never',
      drinkingHabits: 'Never',
    },
    about: {
      aboutMe: `${firstName} is a complete approved profile for match tests.`,
      hobbies: ['Travel', 'Cooking'],
      interests: ['Music', 'Hiking'],
      partnerExpectations: 'Looking for a serious family-oriented match.',
    },
    partnerPreference: {
      ageMin: 25,
      ageMax: 38,
      countries: ['Australia'],
      cities: ['Melbourne'],
      religions: ['Hindu'],
      educationLevels: ['Bachelor degree'],
      occupations: ['Engineer'],
      maritalStatuses: ['NEVER_MARRIED'],
    },
    verification: {
      level: verificationLevel,
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
      status: visibilityStatus,
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
      lastActiveAt,
      ...(activeBoostEndsAt ? { activeBoostEndsAt } : {}),
    },
    moderation: { approvalStatus },
  });
}

async function addPremiumSubscription(userId: mongoose.Types.ObjectId) {
  const plan = await PlanModel.create({
    code: 'PREMIUM',
    name: 'Premium',
    priceCents: 4900,
    currency: 'AUD',
    interval: 'MONTH',
    features: ['Advanced search'],
    limits: { searchResultsPerPage: 25 },
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

describe('match routes', () => {
  it('searches approved visible profiles and excludes blocked users', async () => {
    const viewer = await createUser('viewer@example.com');
    const blocked = await createUser('blocked@example.com');
    const hidden = await createUser('hidden@example.com');
    const ignored = await createUser('ignored@example.com');
    const pending = await createUser('pending@example.com');
    const visible = await createUser('visible@example.com');

    await createProfile({
      userId: viewer.user._id,
      displayId: 'VA200001',
      firstName: 'Amit',
      gender: Gender.MALE,
      age: 32,
    });
    await createProfile({
      userId: blocked.user._id,
      displayId: 'VA200002',
      firstName: 'Blocked',
      gender: Gender.FEMALE,
      age: 29,
    });
    await createProfile({
      userId: hidden.user._id,
      displayId: 'VA200003',
      firstName: 'Hidden',
      gender: Gender.FEMALE,
      age: 29,
      visibilityStatus: 'HIDDEN',
    });
    const ignoredProfile = await createProfile({
      userId: ignored.user._id,
      displayId: 'VA2000031',
      firstName: 'Ignored',
      gender: Gender.FEMALE,
      age: 29,
      city: 'Sydney',
      state: 'NSW',
    });
    await createProfile({
      userId: pending.user._id,
      displayId: 'VA200004',
      firstName: 'Pending',
      gender: Gender.FEMALE,
      age: 29,
      approvalStatus: ProfileApprovalStatus.PENDING,
    });
    await createProfile({
      userId: visible.user._id,
      displayId: 'VA200005',
      firstName: 'Priya',
      gender: Gender.FEMALE,
      age: 29,
      city: 'Sydney',
      state: 'NSW',
    });
    await BlockModel.create({ blockerId: viewer.user._id, blockedId: blocked.user._id });
    await HiddenProfileModel.create({
      userId: viewer.user._id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      profileId: ignoredProfile._id,
      hiddenUserId: ignored.user._id,
    });

    const response = await request(app)
      .get('/api/matches/search?gender=FEMALE&city=Sydney')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    const body = bodyAs<MatchResponseBody>(response);

    expect(body.pagination?.total).toBe(1);
    expect(body.results).toHaveLength(1);
    expect(body.results[0]?.firstName).toBe('Priya');
  });

  it('enforces free subscription limits for advanced filters and page size', async () => {
    const viewer = await createUser('free@example.com');
    await createProfile({
      userId: viewer.user._id,
      displayId: 'VA210001',
      firstName: 'Amit',
      gender: Gender.MALE,
      age: 32,
    });

    await request(app)
      .get('/api/matches/search?incomeMin=100000')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(403);

    const response = await request(app)
      .get('/api/matches/search?pageSize=50')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    const body = bodyAs<MatchResponseBody>(response);

    expect(body.limits.planCode).toBe('FREE');
    expect(body.pagination?.pageSize).toBe(10);
  });

  it('allows premium members to use advanced filters', async () => {
    const viewer = await createUser('premium@example.com');
    const candidate = await createUser('income-match@example.com');

    await createProfile({
      userId: viewer.user._id,
      displayId: 'VA220001',
      firstName: 'Amit',
      gender: Gender.MALE,
      age: 32,
    });
    await createProfile({
      userId: candidate.user._id,
      displayId: 'VA220002',
      firstName: 'Neha',
      gender: Gender.FEMALE,
      age: 30,
    });
    await addPremiumSubscription(viewer.user._id);

    const response = await request(app)
      .get('/api/matches/search?incomeMin=100000&pageSize=50')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    const body = bodyAs<MatchResponseBody>(response);

    expect(body.limits.planCode).toBe('PREMIUM');
    expect(body.pagination?.pageSize).toBe(25);
    expect(body.results[0]?.firstName).toBe('Neha');
  });

  it('returns rule-based recommendations ordered by score with reasons', async () => {
    const viewer = await createUser('recommend@example.com');
    const strong = await createUser('strong@example.com');
    const weak = await createUser('weak@example.com');

    await createProfile({
      userId: viewer.user._id,
      displayId: 'VA230001',
      firstName: 'Amit',
      gender: Gender.MALE,
      age: 32,
      city: 'Melbourne',
    });
    const strongProfile = await createProfile({
      userId: strong.user._id,
      displayId: 'VA230002',
      firstName: 'Priya',
      gender: Gender.FEMALE,
      age: 29,
      city: 'Melbourne',
    });
    await createProfile({
      userId: weak.user._id,
      displayId: 'VA230003',
      firstName: 'Sarah',
      gender: Gender.FEMALE,
      age: 39,
      city: 'Perth',
      state: 'WA',
    });
    await HiddenProfileModel.create({
      userId: viewer.user._id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      profileId: strongProfile._id,
      hiddenUserId: strong.user._id,
    });

    const response = await request(app)
      .get('/api/matches/recommended?limit=12')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    const body = bodyAs<MatchResponseBody>(response);

    expect(body.results.every((profile) => profile.firstName !== 'Priya')).toBe(true);
    expect(body.limits.recommendationLimit).toBe(6);
  });

  it('prioritizes active complete profiles ahead of stale incomplete ones while preserving boosts', async () => {
    const viewer = await createUser('ranking-viewer@example.com');
    const boosted = await createUser('ranking-boosted@example.com');
    const active = await createUser('ranking-active@example.com');
    const stale = await createUser('ranking-stale@example.com');

    await createProfile({
      userId: viewer.user._id,
      displayId: 'VA235001',
      firstName: 'Amit',
      gender: Gender.MALE,
      age: 32,
      city: 'Melbourne',
    });

    await createProfile({
      userId: boosted.user._id,
      displayId: 'VA235002',
      firstName: 'Boosted',
      gender: Gender.FEMALE,
      age: 29,
      city: 'Melbourne',
      completionPercentage: 72,
      verificationLevel: 'BASIC',
      lastActiveAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
      activeBoostEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await createProfile({
      userId: active.user._id,
      displayId: 'VA235003',
      firstName: 'Active',
      gender: Gender.FEMALE,
      age: 29,
      city: 'Melbourne',
      completionPercentage: 96,
      verificationLevel: 'GOLD',
      lastActiveAt: new Date(),
    });

    await createProfile({
      userId: stale.user._id,
      displayId: 'VA235004',
      firstName: 'Stale',
      gender: Gender.FEMALE,
      age: 29,
      city: 'Melbourne',
      completionPercentage: 68,
      verificationLevel: 'BASIC',
      lastActiveAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    });

    const response = await request(app)
      .get('/api/matches/search?sort=RECOMMENDED&pageSize=12')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    const body = bodyAs<MatchResponseBody>(response);
    const names = body.results.map((profile) => profile.firstName);

    expect(names[0]).toBe('Boosted');
    expect(names.indexOf('Active')).toBeGreaterThan(-1);
    expect(names.indexOf('Stale')).toBeGreaterThan(-1);
    expect(names.indexOf('Active')).toBeLessThan(names.indexOf('Stale'));
  });

  it('creates, lists, runs, and deletes saved searches', async () => {
    const viewer = await createUser('saved-search@example.com');
    await createProfile({
      userId: viewer.user._id,
      displayId: 'VA240001',
      firstName: 'Amit',
      gender: Gender.MALE,
      age: 32,
    });

    const createResponse = await request(app)
      .post('/api/matches/saved-searches')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({
        name: 'Melbourne matches',
        query: { page: 1, pageSize: 12, sort: 'RECOMMENDED', city: ['Melbourne'] },
        notifyOnNewMatches: true,
      })
      .expect(201);

    const savedSearch = bodyAs<{ savedSearch: { _id: string; name: string } }>(
      createResponse,
    ).savedSearch;
    expect(savedSearch.name).toBe('Melbourne matches');

    const listResponse = await request(app)
      .get('/api/matches/saved-searches')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(bodyAs<{ savedSearches: unknown[] }>(listResponse).savedSearches).toHaveLength(1);

    await request(app)
      .delete(`/api/matches/saved-searches/${savedSearch._id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(204);

    const emptyResponse = await request(app)
      .get('/api/matches/saved-searches')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);
    expect(bodyAs<{ savedSearches: unknown[] }>(emptyResponse).savedSearches).toHaveLength(0);
  });
});
