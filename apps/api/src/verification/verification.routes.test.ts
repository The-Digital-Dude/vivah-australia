import request from 'supertest';
import type { Response } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, UserRole } from '@vivah/shared';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { ProfileApprovalStatus, ProfileModel, UserModel, VerificationDocumentModel } from '../models/index.js';
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

function bodyAs<TBody>(response: Response): TBody {
  return response.body as TBody;
}

async function createUser(email: string, role: UserRole = UserRole.USER) {
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
    displayId: `VA${userId.toString().slice(-8).toUpperCase()}`,
    completionPercentage: 100,
    personal: { firstName: 'Asha', lastName: 'Member' },
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
    moderation: { approvalStatus: ProfileApprovalStatus.APPROVED },
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

describe('verification routes', () => {
  it('disables mock liveness start and webhook trust effects', async () => {
    const { user, accessToken } = await createUser('verify-kyc@example.com');
    await createProfile(user._id);

    await request(app)
      .post('/api/verification/liveness/start')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(503);

    await request(app)
      .post('/api/verification/liveness/webhook')
      .send({ userId: user.id, status: 'APPROVED' })
      .expect(503);

    expect((await ProfileModel.findOne({ userId: user._id }).orFail()).verification.level).toBe('NONE');
  });

  it('supports signed verification document upload and completion', async () => {
    const { user, accessToken } = await createUser('verify-doc@example.com');
    await createProfile(user._id);

    const signResponse = await request(app)
      .post('/api/me/verification-documents/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        documentType: 'Passport',
        fileName: 'passport.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 150000,
      })
      .expect(201);
    const signBody = bodyAs<{
      document: { id: string };
      upload: { provider: string; method: string; url: string; fields: Record<string, string> };
    }>(signResponse);

    expect(signBody.upload.provider).toBe('gcs');
    expect(signBody.upload.method).toBe('PUT');

    await request(app)
      .put(`/api/mock-gcs-storage/${signBody.upload.fields.storageKey}`)
      .set('Content-Type', 'image/jpeg')
      .send('passport-bytes')
      .expect(200);

    const completeResponse = await request(app)
      .post('/api/me/verification-documents/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        documentId: signBody.document.id,
        assetUrl: signBody.upload.url,
        storageKey: signBody.upload.fields.storageKey,
        bytes: 150000,
      })
      .expect(200);

    expect(bodyAs<{ document: { uploadStatus: string } }>(completeResponse).document.uploadStatus).toBe('UPLOADED');
  });

  it('rejects invalid completion attempts and document-backed requests without a completed upload', async () => {
    const { user, accessToken } = await createUser('verify-guard@example.com');
    await createProfile(user._id);

    const signResponse = await request(app)
      .post('/api/me/verification-documents/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        documentType: 'Passport',
        fileName: 'passport.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 150000,
      })
      .expect(201);
    const signBody = bodyAs<{
      document: { id: string };
      upload: { url: string; fields: Record<string, string> };
    }>(signResponse);

    await request(app)
      .post('/api/me/verification-documents/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        documentId: signBody.document.id,
        assetUrl: 'http://localhost:4000/api/mock-gcs-storage/other-key',
        storageKey: signBody.upload.fields.storageKey,
        bytes: 150000,
      })
      .expect(400);

    await request(app)
      .post('/api/me/verifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'IDENTITY', documentType: 'Passport' })
      .expect(400);

    expect(await VerificationDocumentModel.countDocuments({ uploadStatus: 'UPLOADED' })).toBe(0);
  });
});
