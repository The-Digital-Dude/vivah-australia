import request from 'supertest';
import type { Response } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountStatus, UserRole } from '@vivah/shared';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  ContactInquiryModel,
  FraudEventModel,
  InterestModel,
  LandingPageModel,
  PlanModel,
  ProfileApprovalStatus,
  ProfileModel,
  UserModel,
  type UserDocument,
} from '../models/index.js';
import type { AuthConfig } from '../auth/auth-types.js';

interface FeaturedProfilesResponse {
  profiles: Array<{ displayId: string; responsivenessLabel?: string }>;
}

interface PublicMatchesResponse {
  profiles: Array<{ displayId: string; responsivenessLabel?: string }>;
  limit: number;
  gated: boolean;
}

function bodyAs<TBody>(response: Response): TBody {
  return response.body as TBody;
}

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

describe('public web routes', () => {
  it('returns active public plans without authentication', async () => {
    await PlanModel.create({
      code: 'PREMIUM',
      name: 'Premium',
      priceCents: 4900,
      currency: 'AUD',
      interval: 'MONTH',
      features: ['Send interests'],
      limits: {},
      active: true,
    });

    const response = await request(app).get('/api/public/plans').expect(200);

    expect(response.body).toMatchObject({
      plans: [expect.objectContaining({ code: 'PREMIUM' })],
    });
  });

  it('only returns approved visible featured profiles', async () => {
    const user: UserDocument = await UserModel.create({
      email: 'member@example.com',
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

    await ProfileModel.create({
      userId: user._id,
      userStatus: AccountStatus.ACTIVE,
      userIsDeleted: false,
      displayId: 'VA900001',
      completionPercentage: 80,
      personal: { firstName: 'Priya', age: 31, gender: 'FEMALE' },
      religion: { languagesSpoken: [] },
      location: { city: 'Sydney', country: 'Australia' },
      education: {},
      employment: { occupation: 'Accountant', annualIncomeVisibility: 'PRIVATE' },
      family: {},
      lifestyle: {},
      about: {},
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

    const response = await request(app).get('/api/public/featured-profiles').expect(200);
    const body = bodyAs<FeaturedProfilesResponse>(response);

    expect(body.profiles).toHaveLength(1);
    expect(body.profiles[0]).toMatchObject({ displayId: 'VA900001' });
  });

  it('returns capped public match previews with basic filters', async () => {
    const femaleUser: UserDocument = await UserModel.create({
      email: 'preview-female@example.com',
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

    const maleUser: UserDocument = await UserModel.create({
      email: 'preview-male@example.com',
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

    await ProfileModel.create({
      userId: femaleUser._id,
      userStatus: AccountStatus.ACTIVE,
      userIsDeleted: false,
      displayId: 'VA910001',
      completionPercentage: 84,
      personal: { firstName: 'Priya', age: 29, gender: 'FEMALE' },
      religion: { religion: 'Hindu', languagesSpoken: [] },
      location: { city: 'Sydney', country: 'Australia' },
      education: {},
      employment: { occupation: 'Analyst', annualIncomeVisibility: 'PRIVATE' },
      family: {},
      lifestyle: {},
      about: {},
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
      stats: {
        profileViews: 0,
        interestsReceived: 0,
        interestsSent: 0,
        favouritesCount: 0,
      },
      moderation: { approvalStatus: ProfileApprovalStatus.APPROVED },
    });

    await ProfileModel.create({
      userId: maleUser._id,
      userStatus: AccountStatus.ACTIVE,
      userIsDeleted: false,
      displayId: 'VA910002',
      completionPercentage: 84,
      personal: { firstName: 'Arjun', age: 31, gender: 'MALE' },
      religion: { religion: 'Sikh', languagesSpoken: [] },
      location: { city: 'Melbourne', country: 'Australia' },
      education: {},
      employment: { occupation: 'Engineer', annualIncomeVisibility: 'PRIVATE' },
      family: {},
      lifestyle: {},
      about: {},
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
      stats: {
        profileViews: 0,
        interestsReceived: 0,
        interestsSent: 0,
        favouritesCount: 0,
      },
      moderation: { approvalStatus: ProfileApprovalStatus.APPROVED },
    });

    const response = await request(app)
      .get('/api/public/matches?gender=FEMALE&city=Sydney&religion=Hindu&ageMin=27&ageMax=30')
      .expect(200);

    const body = bodyAs<PublicMatchesResponse>(response);
    expect(body.gated).toBe(true);
    expect(body.limit).toBeGreaterThan(0);
    expect(body.profiles).toHaveLength(1);
    expect(body.profiles[0]).toMatchObject({ displayId: 'VA910001' });
  });

  it('lists active matrimony landing page slugs for sitemap generation', async () => {
    await LandingPageModel.create([
      {
        slug: 'indian-matrimony-sydney',
        title: 'Indian Matrimony in Sydney',
        active: true,
        isDeleted: false,
      },
      {
        slug: 'draft-matrimony-page',
        title: 'Draft Matrimony Page',
        active: false,
        isDeleted: false,
      },
      {
        slug: 'deleted-matrimony-page',
        title: 'Deleted Matrimony Page',
        active: true,
        isDeleted: true,
      },
    ]);

    const response = await request(app).get('/api/public/matrimony').expect(200);

    expect(bodyAs<{ pages: Array<{ slug: string; updatedAt?: string }> }>(response).pages).toEqual([
      expect.objectContaining({ slug: 'indian-matrimony-sydney' }),
    ]);
  });

  it('validates and stores contact inquiries', async () => {
    // Enable Turnstile for testing
    const originalSecret = process.env.TURNSTILE_SECRET;
    process.env.TURNSTILE_SECRET = 'test-secret';

    try {
      // 1. Missing CAPTCHA token
      await request(app)
        .post('/api/public/contact')
        .send({
          name: 'Amit Sharma',
          email: 'amit@example.com',
          subject: 'Membership question',
          message: 'I would like to learn more about premium memberships.',
        })
        .expect(400);

      // 2. Invalid CAPTCHA token
      await request(app)
        .post('/api/public/contact')
        .send({
          name: 'Amit Sharma',
          email: 'amit@example.com',
          subject: 'Membership question',
          message: 'I would like to learn more about premium memberships.',
          captchaToken: 'invalid-token',
        })
        .expect(400);

      // 3. Valid CAPTCHA token
      await request(app)
        .post('/api/public/contact')
        .send({
          name: 'Amit Sharma',
          email: 'amit@example.com',
          subject: 'Membership question',
          message: 'I would like to learn more about premium memberships.',
          captchaToken: 'valid-token',
        })
        .expect(201);

      const inquiry = await ContactInquiryModel.findOne({ email: 'amit@example.com' }).orFail();
      expect(inquiry.subject).toBe('Membership question');
    } finally {
      process.env.TURNSTILE_SECRET = originalSecret;
    }
  });

  it('respects user email notification preferences for auto-receipts', async () => {
    const originalSecret = process.env.TURNSTILE_SECRET;
    process.env.TURNSTILE_SECRET = 'test-secret';

    try {
      // Create a user with email notifications disabled
      await UserModel.create({
        email: 'optout@example.com',
        authProviders: ['email'],
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        mobileVerified: false,
        failedLoginAttempts: 0,
        refreshTokenVersion: 0,
        marketingConsent: false,
        notificationPreferences: {
          emailNotifications: false,
          smsNotifications: false,
          pushNotifications: false,
          marketingNotifications: false,
        },
        metadata: {},
      });

      // Submit contact form as that user
      await request(app)
        .post('/api/public/contact')
        .send({
          name: 'Opted Out User',
          email: 'optout@example.com',
          subject: 'Question',
          message: 'Should not get receipt email.',
          captchaToken: 'valid-token',
        })
        .expect(201);

      // Assert inquiry was created
      const inquiry = await ContactInquiryModel.findOne({ email: 'optout@example.com' }).orFail();
      expect(inquiry.name).toBe('Opted Out User');
    } finally {
      process.env.TURNSTILE_SECRET = originalSecret;
    }
  });

  it('flags duplicate contact attempts for fraud review', async () => {
    // Disable TURNSTILE_SECRET so duplicate tests can run without captcha tokens
    const originalSecret = process.env.TURNSTILE_SECRET;
    delete process.env.TURNSTILE_SECRET;

    try {
      for (let index = 0; index < 3; index += 1) {
        await request(app)
          .post('/api/public/contact')
          .send({
            name: 'Repeated Contact',
            email: 'repeat@example.com',
            subject: 'Membership question',
            message: 'I am sending another detailed inquiry about memberships.',
          })
          .expect(201);
      }

      await vi.waitFor(async () => {
        expect(await FraudEventModel.countDocuments({ rule: 'DUPLICATE_CONTACT_ATTEMPTS' })).toBe(1);
      }, { timeout: 2000 });
    } finally {
      process.env.TURNSTILE_SECRET = originalSecret;
    }
  });

  it('excludes non-active/deleted/suspended/banned users and prioritizes boosted profiles in public matching lists', async () => {
    const activeUser: UserDocument = await UserModel.create({
      email: 'public-active@example.com',
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

    const boostedUser: UserDocument = await UserModel.create({
      email: 'public-boosted@example.com',
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

    const suspendedUser: UserDocument = await UserModel.create({
      email: 'public-suspended@example.com',
      authProviders: ['email'],
      role: UserRole.USER,
      status: AccountStatus.SUSPENDED,
      emailVerified: true,
      mobileVerified: false,
      failedLoginAttempts: 0,
      refreshTokenVersion: 0,
      marketingConsent: false,
      metadata: {},
    });

    // Create profiles
    await ProfileModel.create({
      userId: activeUser._id,
      userStatus: AccountStatus.ACTIVE,
      userIsDeleted: false,
      displayId: 'VA900010',
      completionPercentage: 80,
      personal: { firstName: 'Active User', age: 31, gender: 'FEMALE' },
      religion: { languagesSpoken: [] },
      location: { city: 'Sydney', country: 'Australia' },
      education: {},
      employment: { occupation: 'Accountant', annualIncomeVisibility: 'PRIVATE' },
      family: {},
      lifestyle: {},
      about: {},
      partnerPreference: {},
      verification: { level: 'BASIC' },
      visibility: { status: 'PUBLIC' },
      stats: { profileViews: 0, lastActiveAt: new Date() },
      moderation: { approvalStatus: ProfileApprovalStatus.APPROVED },
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const now = Date.now();
    await ProfileModel.create({
      userId: boostedUser._id,
      userStatus: AccountStatus.ACTIVE,
      userIsDeleted: false,
      displayId: 'VA900011',
      completionPercentage: 80,
      personal: { firstName: 'Boosted User', age: 31, gender: 'FEMALE' },
      religion: { languagesSpoken: [] },
      location: { city: 'Sydney', country: 'Australia' },
      education: {},
      employment: { occupation: 'Accountant', annualIncomeVisibility: 'PRIVATE' },
      family: {},
      lifestyle: {},
      about: {},
      partnerPreference: {},
      verification: { level: 'BASIC' },
      visibility: { status: 'PUBLIC' },
      stats: { profileViews: 0, lastActiveAt: new Date(), activeBoostEndsAt: futureDate },
      moderation: { approvalStatus: ProfileApprovalStatus.APPROVED },
    });

    await InterestModel.create([
      {
        senderId: new mongoose.Types.ObjectId(),
        receiverId: boostedUser._id,
        status: 'ACCEPTED',
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(now - 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      },
      {
        senderId: new mongoose.Types.ObjectId(),
        receiverId: boostedUser._id,
        status: 'ACCEPTED',
        createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(now - 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
      },
      {
        senderId: new mongoose.Types.ObjectId(),
        receiverId: boostedUser._id,
        status: 'ACCEPTED',
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(now - 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
      },
      {
        senderId: new mongoose.Types.ObjectId(),
        receiverId: boostedUser._id,
        status: 'ACCEPTED',
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
      },
    ]);

    await ProfileModel.create({
      userId: suspendedUser._id,
      userStatus: AccountStatus.ACTIVE,
      userIsDeleted: false,
      displayId: 'VA900012',
      completionPercentage: 80,
      personal: { firstName: 'Suspended User', age: 31, gender: 'FEMALE' },
      religion: { languagesSpoken: [] },
      location: { city: 'Sydney', country: 'Australia' },
      education: {},
      employment: { occupation: 'Accountant', annualIncomeVisibility: 'PRIVATE' },
      family: {},
      lifestyle: {},
      about: {},
      partnerPreference: {},
      verification: { level: 'BASIC' },
      visibility: { status: 'PUBLIC' },
      stats: { profileViews: 0, lastActiveAt: new Date(), activeBoostEndsAt: futureDate },
      moderation: { approvalStatus: ProfileApprovalStatus.APPROVED },
    });

    // Verify featured-profiles
    const resFeatured = await request(app).get('/api/public/featured-profiles').expect(200);
    const bodyFeatured = bodyAs<FeaturedProfilesResponse>(resFeatured);
    // Suspended user must be excluded, boosted user must come first
    expect(bodyFeatured.profiles).toHaveLength(2);
    expect(bodyFeatured.profiles[0]?.displayId).toBe('VA900011');
    expect(bodyFeatured.profiles[1]?.displayId).toBe('VA900010');
    expect(bodyFeatured.profiles[0]?.responsivenessLabel).toBe('Very Responsive');

    // Verify public matches route
    const resMatches = await request(app).get('/api/public/matches?gender=FEMALE').expect(200);
    const bodyMatches = bodyAs<PublicMatchesResponse>(resMatches);
    expect(bodyMatches.profiles).toHaveLength(2);
    expect(bodyMatches.profiles[0]?.displayId).toBe('VA900011');
    expect(bodyMatches.profiles[1]?.displayId).toBe('VA900010');
    expect(bodyMatches.profiles[0]?.responsivenessLabel).toBe('Very Responsive');
  });
});
