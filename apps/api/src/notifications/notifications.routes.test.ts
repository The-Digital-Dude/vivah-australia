import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, UserRole } from '@vivah/shared';
import { createApp } from '../app.js';
import { createTokenPair } from '../auth/token.service.js';
import type { AuthConfig } from '../auth/auth-types.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { MobileOtpModel, ProfileModel, PushSubscriptionModel, UserModel } from '../models/index.js';

const authConfig: AuthConfig = {
  accessSecret: 'test-access-secret-minimum-32-characters',
  refreshSecret: 'test-refresh-secret-minimum-32-characters',
  accessExpiresIn: '15m',
  refreshExpiresIn: '30d',
  exposeSensitiveTokens: true,
};

const app = createApp({ corsOrigins: ['http://localhost:3000'], auth: authConfig });
let mongoServer: MongoMemoryServer;

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
  await ProfileModel.create({
    userId: user._id,
    displayId: 'VAOTP001',
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
    verification: { level: 'NONE', emailVerified: true, mobileVerified: false },
    visibility: { status: 'MEMBERS_ONLY' },
    stats: {},
    moderation: {},
  });
  const accessToken = createTokenPair(authConfig, {
    id: user.id,
    role: user.role,
    refreshTokenVersion: user.refreshTokenVersion,
  }).accessToken;
  return { user, accessToken };
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

describe('notification delivery extensions', () => {
  it('requests and verifies mobile OTP', async () => {
    const { user, accessToken } = await createUser('otp@example.com');
    const mobile = '+61412345678';

    await request(app)
      .post('/api/me/mobile/request-otp')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ mobile })
      .expect(201);
    expect(await MobileOtpModel.countDocuments({ userId: user._id, mobile })).toBe(1);

    await request(app)
      .post('/api/me/mobile/verify-otp')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ mobile, code: '123456' })
      .expect(200);
    expect((await UserModel.findById(user._id).orFail()).mobileVerified).toBe(true);
    expect(
      (await ProfileModel.findOne({ userId: user._id }).orFail()).verification.mobileVerified,
    ).toBe(true);
  });

  it('stores push subscriptions and queues a test push notification', async () => {
    const { user, accessToken } = await createUser('push@example.com');
    await request(app)
      .post('/api/me/push-subscriptions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        endpoint: 'https://push.example/subscription/1',
        keys: { p256dh: 'placeholder-p256dh-key', auth: 'placeholder-auth-key' },
        userAgent: 'vitest',
      })
      .expect(201);

    await request(app)
      .post('/api/me/push/test')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(200);

    expect(await PushSubscriptionModel.countDocuments({ userId: user._id })).toBe(1);
  });
});
