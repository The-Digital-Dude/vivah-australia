import request from 'supertest';
import type { Response } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, UserRole } from '@vivah/shared';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  BannerModel,
  BlogPostModel,
  CmsPageModel,
  ContactInquiryModel,
  FraudEventModel,
  PlanModel,
  ProfileApprovalStatus,
  ProfileModel,
  SuccessStoryModel,
  SystemSettingModel,
  TestimonialModel,
  UserModel,
} from '../models/index.js';
import type { AuthConfig } from '../auth/auth-types.js';
import { createTokenPair } from '../auth/token.service.js';

interface FeaturedProfilesResponse {
  profiles: Array<{ displayId: string }>;
}

interface PublicMatchesResponse {
  profiles: Array<{ displayId: string }>;
  limit: number;
  gated: boolean;
}

interface CmsPageResponse {
  page: {
    _id: string;
    title: string;
  };
}

function bodyAs<TBody>(response: Response): TBody {
  return response.body as TBody;
}

function hasTitle(value: unknown): value is { title: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    typeof (value as { title?: unknown }).title === 'string'
  );
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

async function createAdminAccessToken() {
  const admin = await UserModel.create({
    email: 'admin@example.com',
    authProviders: ['email'],
    role: UserRole.ADMIN,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    mobileVerified: false,
    failedLoginAttempts: 0,
    refreshTokenVersion: 0,
    marketingConsent: false,
    metadata: {},
  });

  return createTokenPair(authConfig, {
    id: admin.id,
    role: admin.role,
    refreshTokenVersion: admin.refreshTokenVersion,
  }).accessToken;
}

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
    const user = await UserModel.create({
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
    const femaleUser = await UserModel.create({
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

    const maleUser = await UserModel.create({
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

  it('creates and serves CMS pages through admin CRUD and public fetch', async () => {
    const accessToken = await createAdminAccessToken();
    const createResponse = await request(app)
      .post('/api/admin/cms/pages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        slug: 'about-us',
        title: 'About Us',
        body: 'Published CMS page.',
        published: true,
      })
      .expect(201);

    const publicResponse = await request(app).get('/api/public/pages/about-us').expect(200);
    expect(bodyAs<CmsPageResponse>(publicResponse).page.title).toBe('About Us');

    const listResponse = await request(app)
      .get('/api/admin/cms/pages')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(bodyAs<{ pages: Array<{ slug: string }> }>(listResponse).pages).toContainEqual(
      expect.objectContaining({ slug: 'about-us' }),
    );

    await request(app)
      .patch(`/api/admin/cms/pages/${bodyAs<CmsPageResponse>(createResponse).page._id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'About Vivah Australia' })
      .expect(200);

    const updated: unknown = await CmsPageModel.findOne({ slug: 'about-us' }).orFail();
    expect(hasTitle(updated)).toBe(true);

    if (hasTitle(updated)) {
      expect(updated.title).toBe('About Vivah Australia');
    }
  });

  it('manages homepage and CMS content collections from admin APIs', async () => {
    const accessToken = await createAdminAccessToken();
    await request(app)
      .put('/api/admin/cms/home')
      .set('Authorization', `Bearer ${accessToken}`)
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
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        slug: 'profile-guide',
        title: 'Profile guide',
        body: 'Useful profile guidance.',
        published: true,
      })
      .expect(201);

    await request(app)
      .post('/api/admin/cms/success-stories')
      .set('Authorization', `Bearer ${accessToken}`)
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
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Member family',
        quote: 'The service felt considered.',
        published: true,
      })
      .expect(201);

    await request(app)
      .post('/api/admin/cms/banners')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        key: 'homepage-hero',
        title: 'Homepage hero',
        imageUrl: 'https://example.com/hero.jpg',
        active: true,
      })
      .expect(201);

    await request(app)
      .get('/api/admin/cms/blogs')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    await request(app)
      .get('/api/admin/cms/success-stories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    await request(app)
      .get('/api/admin/cms/testimonials')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    await request(app)
      .get('/api/admin/cms/banners')
      .set('Authorization', `Bearer ${accessToken}`)
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

  it('validates and stores contact inquiries', async () => {
    // Enable hCaptcha for testing
    const originalSecret = process.env.HCAPTCHA_SECRET;
    process.env.HCAPTCHA_SECRET = 'test-secret';

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
      process.env.HCAPTCHA_SECRET = originalSecret;
    }
  });

  it('respects user email notification preferences for auto-receipts', async () => {
    const originalSecret = process.env.HCAPTCHA_SECRET;
    process.env.HCAPTCHA_SECRET = 'test-secret';

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
      process.env.HCAPTCHA_SECRET = originalSecret;
    }
  });

  it('flags duplicate contact attempts for fraud review', async () => {
    // Disable HCAPTCHA_SECRET so duplicate tests can run without captcha tokens
    const originalSecret = process.env.HCAPTCHA_SECRET;
    delete process.env.HCAPTCHA_SECRET;

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

      expect(await FraudEventModel.countDocuments({ rule: 'DUPLICATE_CONTACT_ATTEMPTS' })).toBe(1);
    } finally {
      process.env.HCAPTCHA_SECRET = originalSecret;
    }
  });
});
