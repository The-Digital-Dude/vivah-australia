import request from 'supertest';
import type { Response } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  AccountStatus,
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
  UserRole,
  VerificationStatus,
} from '@vivah/shared';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { ProfileMediaModel, ProfileModel, UserModel } from '../models/index.js';
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

interface MediaResponseBody {
  media: {
    id: string;
    category: string;
    visibility: string;
    uploadStatus: string;
    approvalStatus: string;
    assetUrl: string;
    isPrimary: boolean;
  };
}

interface SignResponseBody extends MediaResponseBody {
  upload: {
    provider: string;
    url: string;
    fields: Record<string, string>;
  };
}

interface AccessResponseBody extends MediaResponseBody {
  access: {
    url: string;
    token: string;
    expiresAt: string;
  };
}

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
    completionPercentage: 10,
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
    moderation: { approvalStatus: 'PENDING' },
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

describe('media routes', () => {
  it('creates a signed profile photo upload and pending media record', async () => {
    const { user, accessToken } = await createUser('media@example.com');
    await createProfile(user._id);

    const response = await request(app)
      .post('/api/me/media/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: MediaCategory.PROFILE_PHOTO,
        fileName: 'profile.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 500000,
      })
      .expect(201);

    const body = bodyAs<SignResponseBody>(response);

    expect(body.upload.provider).toBe('mock');
    expect(body.upload.fields.signature).toEqual(expect.any(String));
    expect(body.media.category).toBe(MediaCategory.PROFILE_PHOTO);
    expect(body.media.visibility).toBe(MediaVisibility.PUBLIC);
    expect(body.media.uploadStatus).toBe(MediaUploadStatus.SIGNED);
    expect(body.media.approvalStatus).toBe(VerificationStatus.PENDING);
    expect(body.media.isPrimary).toBe(true);
  });

  it('rejects unsupported file types and oversized files', async () => {
    const { user, accessToken } = await createUser('invalid-media@example.com');
    await createProfile(user._id);

    await request(app)
      .post('/api/me/media/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: MediaCategory.PUBLIC_GALLERY,
        fileName: 'script.svg',
        mimeType: 'image/svg+xml',
        fileSizeBytes: 1000,
      })
      .expect(400);

    await request(app)
      .post('/api/me/media/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: MediaCategory.PUBLIC_GALLERY,
        fileName: 'large.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 11 * 1024 * 1024,
      })
      .expect(400);
  });

  it('completes upload and returns signed private access', async () => {
    const { user, accessToken } = await createUser('private-media@example.com');
    await createProfile(user._id);

    const signResponse = await request(app)
      .post('/api/me/media/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: MediaCategory.PRIVATE_GALLERY,
        fileName: 'private.webp',
        mimeType: 'image/webp',
        fileSizeBytes: 250000,
      })
      .expect(201);
    const signBody = bodyAs<SignResponseBody>(signResponse);

    const completeResponse = await request(app)
      .post('/api/me/media/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mediaId: signBody.media.id,
        assetUrl: 'https://cdn.example.com/private.webp',
        storageKey: 'vivah/profiles/private.webp',
        bytes: 250000,
        width: 1200,
        height: 900,
      })
      .expect(200);
    const completeBody = bodyAs<MediaResponseBody>(completeResponse);

    expect(completeBody.media.uploadStatus).toBe(MediaUploadStatus.UPLOADED);
    expect(completeBody.media.visibility).toBe(MediaVisibility.PRIVATE);

    const accessResponse = await request(app)
      .get(`/api/me/media/${signBody.media.id}/access`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const accessBody = bodyAs<AccessResponseBody>(accessResponse);

    expect(accessBody.access.url).toContain('mediaAccessToken=');
    expect(accessBody.access.token).toEqual(expect.any(String));
  });

  it('allows admin media review and queue listing', async () => {
    const owner = await createUser('owner-media@example.com');
    const admin = await createUser('admin-media@example.com', UserRole.ADMIN);
    const profile = await createProfile(owner.user._id);
    const media = await ProfileMediaModel.create({
      userId: owner.user._id,
      profileId: profile._id,
      assetUrl: 'https://cdn.example.com/review.jpg',
      storageKey: 'vivah/review.jpg',
      mediaType: 'PHOTO',
      category: MediaCategory.PUBLIC_GALLERY,
      uploadStatus: MediaUploadStatus.UPLOADED,
      mimeType: 'image/jpeg',
      fileSizeBytes: 100000,
      originalFilename: 'review.jpg',
      visibility: MediaVisibility.PUBLIC,
      approvalStatus: VerificationStatus.PENDING,
      isPrimary: false,
    });

    const listResponse = await request(app)
      .get('/api/admin/media?status=PENDING')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(bodyAs<{ media: unknown[] }>(listResponse).media).toHaveLength(1);

    const reviewResponse = await request(app)
      .patch(`/api/admin/media/${media.id}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ approvalStatus: VerificationStatus.APPROVED })
      .expect(200);
    const reviewBody = bodyAs<MediaResponseBody>(reviewResponse);

    expect(reviewBody.media.approvalStatus).toBe(VerificationStatus.APPROVED);
  });
});
