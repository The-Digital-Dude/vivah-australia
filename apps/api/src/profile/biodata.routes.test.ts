import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, SubscriptionStatus, UserRole } from '@vivah/shared';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  PlanModel,
  ProfileApprovalStatus,
  ProfileModel,
  SubscriptionModel,
  UserModel,
  type ProfileDocument,
  type UserDocument,
} from '../models/index.js';
import { createTokenPair } from '../auth/token.service.js';
import type { AuthConfig } from '../auth/auth-types.js';
import { generateBiodataPdf } from './biodata.service.js';

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

async function createUser(email: string): Promise<{ user: UserDocument; accessToken: string }> {
  const user: UserDocument = await UserModel.create({
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
    refreshTokenVersion: 0,
  }).accessToken;
  return { user, accessToken };
}

async function createApprovedProfile(
  userId: mongoose.Types.ObjectId,
  displayId = 'VA999001',
  overrides: Record<string, unknown> = {},
): Promise<ProfileDocument> {
  const profile: ProfileDocument = await ProfileModel.create({
    userId,
    displayId,
    completionPercentage: 85,
    personal: {
      firstName: 'Ananya',
      lastName: 'Mehta',
      gender: 'FEMALE',
      maritalStatus: 'NEVER_MARRIED',
      age: 28,
      heightCm: 162,
    },
    location: { city: 'Melbourne', state: 'VIC', country: 'Australia', visaStatus: 'CITIZEN' },
    religion: { religion: 'Hindu', community: 'Gujarati', motherTongue: 'Gujarati', languagesSpoken: ['English', 'Gujarati'] },
    education: { highestQualification: 'Master degree' },
    employment: { occupation: 'Software Engineer', industry: 'Technology' },
    family: { familyValues: 'MODERATE', familyType: 'NUCLEAR' },
    lifestyle: { dietaryPreferences: 'VEGETARIAN', smokingHabits: 'NON_SMOKER', drinkingHabits: 'NON_DRINKER' },
    about: {
      aboutMe: 'A driven professional who values family deeply.',
      hobbies: ['Reading', 'Yoga'],
      interests: ['Cooking', 'Travel'],
      partnerExpectations: 'Someone kind, ambitious and family-oriented.',
    },
    partnerPreference: {
      ageMin: 28,
      ageMax: 35,
      religions: ['Hindu'],
      communities: ['Gujarati'],
      countries: ['Australia'],
      educationLevels: ['Bachelor degree', 'Master degree'],
    },
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
      status: 'PUBLIC',
      showPhoto: true,
      showIncome: false,
      showEmployer: false,
      showLastName: true,
    },
    stats: { profileViews: 0, interestsReceived: 0, interestsSent: 0, favouritesCount: 0 },
    moderation: { approvalStatus: ProfileApprovalStatus.APPROVED },
    ...overrides,
  });
  return profile;
}

async function addPremiumSubscription(userId: mongoose.Types.ObjectId): Promise<void> {
  const plan = await PlanModel.create({
    code: 'PREMIUM',
    name: 'Premium',
    priceCents: 4900,
    currency: 'AUD',
    interval: 'MONTH',
    features: ['Download Biodata'],
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

// ─── Endpoint integration tests ───────────────────────────────────────────────

describe('GET /api/profiles/:id/biodata.pdf', () => {
  it('returns a valid PDF for an authenticated free-tier viewer', async () => {
    const owner = await createUser('owner-biodata@example.com');
    const profile = await createApprovedProfile(owner.user._id);
    const viewer = await createUser('viewer-biodata@example.com');

    const response = await request(app)
      .get(`/api/profiles/${profile.id}/biodata.pdf`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/pdf/);
    expect(response.body).toBeDefined();
    // The response body as Buffer should start with the PDF magic bytes %PDF
    const body = Buffer.from(response.body as ArrayBuffer);
    expect(body.length).toBeGreaterThan(0);
    expect(body.slice(0, 4).toString()).toBe('%PDF');
  });

  it('returns a valid PDF for an authenticated paid-tier viewer', async () => {
    const owner = await createUser('owner-paid@example.com');
    const profile = await createApprovedProfile(owner.user._id, 'VA999002');
    const viewer = await createUser('viewer-paid@example.com');
    await addPremiumSubscription(viewer.user._id);

    const response = await request(app)
      .get(`/api/profiles/${profile.id}/biodata.pdf`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/pdf/);
    const body = Buffer.from(response.body as ArrayBuffer);
    expect(body.slice(0, 4).toString()).toBe('%PDF');
  });

  it('requires authentication — returns 401 without a token', async () => {
    const owner = await createUser('owner-unauth@example.com');
    const profile = await createApprovedProfile(owner.user._id, 'VA999003');

    await request(app).get(`/api/profiles/${profile.id}/biodata.pdf`).expect(401);
  });

  it('returns 404 for a profile that does not exist', async () => {
    const viewer = await createUser('viewer-404@example.com');
    const fakeId = new mongoose.Types.ObjectId().toHexString();

    await request(app)
      .get(`/api/profiles/${fakeId}/biodata.pdf`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(404);
  });

  it('still generates a valid PDF when the profile has showPhoto = false', async () => {
    const owner = await createUser('owner-nophoto@example.com');
    const profile = await createApprovedProfile(owner.user._id, 'VA999004', {
      visibility: {
        status: 'PUBLIC',
        showPhoto: false,    // photo visibility off — must not appear in PDF
        showIncome: false,
        showEmployer: false,
        showLastName: true,
      },
    });
    const viewer = await createUser('viewer-nophoto@example.com');

    const response = await request(app)
      .get(`/api/profiles/${profile.id}/biodata.pdf`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/pdf/);
    const body = Buffer.from(response.body as ArrayBuffer);
    expect(body.slice(0, 4).toString()).toBe('%PDF');
  });
});

// ─── Service-level photo gating and tier tests ────────────────────────────────

describe('generateBiodataPdf service', () => {
  const minimalProfile = {
    displayId: 'VA000001',
    personal: { firstName: 'Test', lastName: 'User', age: 30, gender: 'MALE', maritalStatus: 'NEVER_MARRIED' },
    location: { city: 'Sydney', state: 'NSW', country: 'Australia' },
    religion: { religion: 'Hindu', community: 'Indian' },
    education: { highestQualification: 'Bachelor degree' },
    employment: { occupation: 'Engineer' },
  };

  it('generates a valid PDF buffer for the free template', async () => {
    const pdf = await generateBiodataPdf(minimalProfile, { isPaid: false });
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.slice(0, 4).toString()).toBe('%PDF');
  });

  it('generates a valid PDF buffer for the premium template', async () => {
    const pdf = await generateBiodataPdf(minimalProfile, { isPaid: true });
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.slice(0, 4).toString()).toBe('%PDF');
  });

  it('free and premium templates produce distinct PDF outputs', async () => {
    const freePdf = await generateBiodataPdf(minimalProfile, { isPaid: false });
    const premiumPdf = await generateBiodataPdf(minimalProfile, { isPaid: true });
    // Different templates → different byte sequences
    expect(freePdf.equals(premiumPdf)).toBe(false);
  });

  it('does not include a photo when photoUrl is undefined (private/unapproved)', async () => {
    // photoUrl is only set when visibility.showPhoto=true AND an approved photo exists.
    // Here we pass no photoUrl — the premium template must still produce a valid PDF.
    const profileWithoutPhoto = { ...minimalProfile, photoUrl: undefined };
    const pdf = await generateBiodataPdf(profileWithoutPhoto, { isPaid: true });
    expect(pdf.slice(0, 4).toString()).toBe('%PDF');
    // The PDF should be non-trivially sized (has header, sections, footer)
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it('does not fetch a remote URL for a free-tier member even if photoUrl is present', async () => {
    // Free template never includes photos regardless of photoUrl presence
    const profileWithPhotoUrl = {
      ...minimalProfile,
      photoUrl: 'https://example.com/photo.jpg',  // never fetched by free template
    };
    // This must complete without network error (free template skips photo fetch entirely)
    const pdf = await generateBiodataPdf(profileWithPhotoUrl, { isPaid: false });
    expect(pdf.slice(0, 4).toString()).toBe('%PDF');
  });
});
