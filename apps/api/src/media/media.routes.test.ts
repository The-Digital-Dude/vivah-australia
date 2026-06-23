import request from 'supertest';
import request, { type Response } from 'supertest';
import fs from 'fs';
import path from 'path';
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
import {
  PhotoRequestModel,
  ProfileMediaModel,
  ProfileModel,
  UserModel,
  type ProfileDocument,
  type UserDocument,
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

interface MediaResponseBody {
  media: {
    id: string;
    category: string;
    visibility: string;
    uploadStatus: string;
    approvalStatus: string;
    assetUrl: string;
    videoPosterUrl?: string;
    durationSeconds?: number;
    isPrimary: boolean;
  };
}

interface SignResponseBody extends MediaResponseBody {
  upload: {
    provider: string;
    method: string;
    url: string;
    expiresAt: string;
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

async function createUser(
  email: string,
  role: UserRole = UserRole.USER,
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

async function createProfile(userId: mongoose.Types.ObjectId) {
  const profile: ProfileDocument = await ProfileModel.create({
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
  return profile;
}

async function createPrivateUploadedMedia(
  userId: mongoose.Types.ObjectId,
  profileId: mongoose.Types.ObjectId,
  assetUrl = 'https://cdn.example.com/private-photo.jpg',
) {
  return ProfileMediaModel.create({
    userId,
    profileId,
    assetUrl,
    storageKey: `vivah/private/${userId.toString()}.jpg`,
    mediaType: 'PHOTO',
    category: MediaCategory.PRIVATE_GALLERY,
    uploadStatus: MediaUploadStatus.UPLOADED,
    mimeType: 'image/jpeg',
    fileSizeBytes: 180000,
    originalFilename: 'private-photo.jpg',
    visibility: MediaVisibility.PRIVATE,
    approvalStatus: VerificationStatus.APPROVED,
    isPrimary: false,
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
    expect(body.upload.method).toBe('PUT');
    expect(body.upload.fields.storageKey).toEqual(expect.any(String));
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
        assetUrl: signBody.upload.url,
        storageKey: signBody.upload.fields.storageKey,
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

    expect(accessBody.access.url).toContain('/api/media/private/');
    expect(accessBody.access.url).toContain('mediaAccessToken=');
    expect(accessBody.access.token).toEqual(expect.any(String));
  });

  it('creates a signed VIDEO_INTRO upload with video mime type and 50MB limit', async () => {
    const { user, accessToken } = await createUser('video-intro@example.com');
    await createProfile(user._id);

    // Valid video upload
    const response = await request(app)
      .post('/api/me/media/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: MediaCategory.VIDEO_INTRO,
        fileName: 'intro.mp4',
        mimeType: 'video/mp4',
        fileSizeBytes: 20 * 1024 * 1024, // 20MB — within 50MB limit
      })
      .expect(201);

    const body = bodyAs<SignResponseBody>(response);
    expect(body.media.category).toBe(MediaCategory.VIDEO_INTRO);
    expect(body.media.uploadStatus).toBe(MediaUploadStatus.SIGNED);
    expect(body.upload.provider).toBe('mock');
  });

  it('rejects VIDEO_INTRO uploads with image mime type or files over 50MB', async () => {
    const { user, accessToken } = await createUser('video-invalid@example.com');
    await createProfile(user._id);

    // Reject image MIME type for VIDEO_INTRO
    await request(app)
      .post('/api/me/media/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: MediaCategory.VIDEO_INTRO,
        fileName: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 1 * 1024 * 1024,
      })
      .expect(400);

    // Reject video over 50MB limit
    await request(app)
      .post('/api/me/media/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: MediaCategory.VIDEO_INTRO,
        fileName: 'huge.mp4',
        mimeType: 'video/mp4',
        fileSizeBytes: 51 * 1024 * 1024,
      })
      .expect(400);
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

  it('rejects completion after upload expiry, with mismatched URLs, and from the wrong state', async () => {
    const { user, accessToken } = await createUser('completion-guard@example.com');
    await createProfile(user._id);

    const signResponse = await request(app)
      .post('/api/me/media/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: MediaCategory.PUBLIC_GALLERY,
        fileName: 'guard.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 150000,
      })
      .expect(201);
    const signBody = bodyAs<SignResponseBody>(signResponse);

    await request(app)
      .post('/api/me/media/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mediaId: signBody.media.id,
        assetUrl: 'http://localhost:4000/api/mock-gcs-storage/other-key',
        storageKey: signBody.upload.fields.storageKey,
        bytes: 150000,
      })
      .expect(400);

    await ProfileMediaModel.updateOne(
      { _id: signBody.media.id },
      { $set: { uploadExpiresAt: new Date(Date.now() - 1000) } },
    );

    await request(app)
      .post('/api/me/media/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mediaId: signBody.media.id,
        assetUrl: signBody.upload.url,
        storageKey: signBody.upload.fields.storageKey,
        bytes: 150000,
      })
      .expect(400);

    await ProfileMediaModel.updateOne(
      { _id: signBody.media.id },
      {
        $set: {
          uploadExpiresAt: new Date(Date.now() + 60_000),
          uploadStatus: MediaUploadStatus.UPLOADED,
        },
      },
    );

    await request(app)
      .post('/api/me/media/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mediaId: signBody.media.id,
        assetUrl: signBody.upload.url,
        storageKey: signBody.upload.fields.storageKey,
        bytes: 150000,
      })
      .expect(400);
  });

  it('requires video duration and enforces the video completion limit', async () => {
    const { user, accessToken } = await createUser('video-complete@example.com');
    await createProfile(user._id);

    const signResponse = await request(app)
      .post('/api/me/media/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: MediaCategory.VIDEO_INTRO,
        fileName: 'intro.mp4',
        mimeType: 'video/mp4',
        fileSizeBytes: 20 * 1024 * 1024,
      })
      .expect(201);
    const signBody = bodyAs<SignResponseBody>(signResponse);

    await request(app)
      .post('/api/me/media/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mediaId: signBody.media.id,
        assetUrl: signBody.upload.url,
        storageKey: signBody.upload.fields.storageKey,
        bytes: 20 * 1024 * 1024,
      })
      .expect(400);

    await request(app)
      .post('/api/me/media/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mediaId: signBody.media.id,
        assetUrl: signBody.upload.url,
        storageKey: signBody.upload.fields.storageKey,
        bytes: 20 * 1024 * 1024,
        durationSeconds: 130,
      })
      .expect(400);
  });

  it('completes a valid video intro upload and stores duration plus poster metadata', async () => {
    const { user, accessToken } = await createUser('video-success@example.com');
    await createProfile(user._id);

    const signResponse = await request(app)
      .post('/api/me/media/sign-upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: MediaCategory.VIDEO_INTRO,
        fileName: 'intro.mp4',
        mimeType: 'video/mp4',
        fileSizeBytes: 20 * 1024 * 1024,
      })
      .expect(201);
    const signBody = bodyAs<SignResponseBody>(signResponse);

    const completeResponse = await request(app)
      .post('/api/me/media/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mediaId: signBody.media.id,
        assetUrl: signBody.upload.url,
        storageKey: signBody.upload.fields.storageKey,
        bytes: 20 * 1024 * 1024,
        durationSeconds: 75,
      })
      .expect(200);

    const completeBody = bodyAs<MediaResponseBody>(completeResponse);
    expect(completeBody.media.uploadStatus).toBe(MediaUploadStatus.UPLOADED);
    expect(completeBody.media.category).toBe(MediaCategory.VIDEO_INTRO);
    expect(completeBody.media.durationSeconds).toBe(75);
    expect(completeBody.media.videoPosterUrl).toBeTruthy();

    const stored = await ProfileMediaModel.findById(signBody.media.id).orFail();
    expect(stored.mediaType).toBe('VIDEO');
    expect(stored.durationSeconds).toBe(75);
    expect(stored.videoPosterUrl).toBeTruthy();
  });

  it('allows admin review actions for uploaded video media', async () => {
    const owner = await createUser('owner-video-review@example.com');
    const admin = await createUser('admin-video-review@example.com', UserRole.ADMIN);
    const profile = await createProfile(owner.user._id);
    const media = await ProfileMediaModel.create({
      userId: owner.user._id,
      profileId: profile._id,
      assetUrl: 'https://cdn.example.com/video-intro.mp4',
      storageKey: 'vivah/video-intro.mp4',
      mediaType: 'VIDEO',
      category: MediaCategory.VIDEO_INTRO,
      uploadStatus: MediaUploadStatus.UPLOADED,
      mimeType: 'video/mp4',
      fileSizeBytes: 12_000_000,
      originalFilename: 'video-intro.mp4',
      thumbnailUrl: 'https://cdn.example.com/video-intro-thumb.jpg',
      videoPosterUrl: 'https://cdn.example.com/video-intro-poster.jpg',
      durationSeconds: 62,
      visibility: MediaVisibility.PUBLIC,
      approvalStatus: VerificationStatus.PENDING,
      isPrimary: false,
    });

    const reviewResponse = await request(app)
      .patch(`/api/admin/media/${media.id}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ approvalStatus: VerificationStatus.APPROVED })
      .expect(200);
    const reviewBody = bodyAs<MediaResponseBody>(reviewResponse);
    expect(reviewBody.media.approvalStatus).toBe(VerificationStatus.APPROVED);

    await request(app)
      .patch(`/api/admin/media/${media.id}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ approvalStatus: VerificationStatus.NEEDS_RESUBMISSION, reason: 'Please trim the video intro.' })
      .expect(200);

    const updated = await ProfileMediaModel.findById(media.id).orFail();
    expect(updated.approvalStatus).toBe(VerificationStatus.NEEDS_RESUBMISSION);
    expect(updated.moderationReason).toBe('Please trim the video intro.');
  });

  it('fails fast in production without Google Cloud Storage and does not mount mock storage', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousBucket = process.env.GCS_BUCKET;

    process.env.NODE_ENV = 'production';
    delete process.env.GCS_BUCKET;

    const productionApp = createApp({
      corsOrigins: ['http://localhost:3000'],
      auth: authConfig,
    });

    try {
      const { user, accessToken } = await createUser('prod-media@example.com');
      await createProfile(user._id);

      await request(productionApp)
        .post('/api/me/media/sign-upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          category: MediaCategory.PUBLIC_GALLERY,
          fileName: 'prod.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 150000,
        })
        .expect(500);

      await request(productionApp)
        .put('/api/mock-gcs-storage/test-key')
        .send('hello')
        .expect(404);
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
      if (previousBucket === undefined) {
        delete process.env.GCS_BUCKET;
      } else {
        process.env.GCS_BUCKET = previousBucket;
      }
    }
  });

  it('allows an owner to access their own private media without a photo request grant', async () => {
    const owner = await createUser('media-owner@example.com');
    const profile = await createProfile(owner.user._id);
    const media = await createPrivateUploadedMedia(owner.user._id, profile._id);

    const response = await request(app)
      .get(`/api/media/${media.id}/access`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const body = bodyAs<AccessResponseBody>(response);
    expect(body.access.url).toContain('/api/media/private/');
    expect(body.access.token).toEqual(expect.any(String));
  });

  it('allows admin and moderator roles to access any private media', async () => {
    const owner = await createUser('media-owner-admin@example.com');
    const admin = await createUser('media-admin@example.com', UserRole.ADMIN);
    const moderator = await createUser('media-moderator@example.com', UserRole.MODERATOR);
    const profile = await createProfile(owner.user._id);
    const media = await createPrivateUploadedMedia(owner.user._id, profile._id);

    await request(app)
      .get(`/api/media/${media.id}/access`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    await request(app)
      .get(`/api/media/${media.id}/access`)
      .set('Authorization', `Bearer ${moderator.accessToken}`)
      .expect(200);
  });

  it('allows a viewer with an accepted non-expired photo request grant', async () => {
    const owner = await createUser('media-owner-grant@example.com');
    const viewer = await createUser('media-viewer-grant@example.com');
    const profile = await createProfile(owner.user._id);
    const media = await createPrivateUploadedMedia(owner.user._id, profile._id);

    await PhotoRequestModel.create({
      requesterId: viewer.user._id,
      ownerId: owner.user._id,
      ownerProfileId: profile._id,
      status: 'ACCEPTED',
      accessGrantedUntil: new Date(Date.now() + 60 * 60 * 1000),
    });

    const response = await request(app)
      .get(`/api/media/${media.id}/access`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    const body = bodyAs<AccessResponseBody>(response);
    expect(body.access.url).toContain('/api/media/private/');
    expect(body.access.token).toEqual(expect.any(String));
  });

  it('keeps local/mock-storage private originals successful and unwatermarked', async () => {
    const { user, accessToken } = await createUser('private-local-media@example.com');
    const profile = await createProfile(user._id);
    const media = await createPrivateUploadedMedia(
      user._id,
      profile._id,
      'http://localhost:4000/api/mock-gcs-storage/vivah/private/local-private.webp',
    );
    media.uploadProvider = 'mock';
    media.storageKey = 'vivah/private/local-private.webp';
    media.mimeType = 'image/webp';
    await media.save();

    const uploadDir = path.join(process.cwd(), 'uploads', 'vivah', 'private');
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, 'local-private.webp'), 'local-private-image-bytes');

    const accessResponse = await request(app)
      .get(`/api/me/media/${media.id}/access`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const accessBody = bodyAs<AccessResponseBody>(accessResponse);
    const privateUrl = new URL(accessBody.access.url);

    const deliveryResponse = await request(app)
      .get(`${privateUrl.pathname}${privateUrl.search}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(deliveryResponse.headers['content-type']).toContain('image/webp');
  });

  it('denies a viewer with an expired accepted photo request grant', async () => {
    const owner = await createUser('media-owner-expired@example.com');
    const viewer = await createUser('media-viewer-expired@example.com');
    const profile = await createProfile(owner.user._id);
    const media = await createPrivateUploadedMedia(owner.user._id, profile._id);

    await PhotoRequestModel.create({
      requesterId: viewer.user._id,
      ownerId: owner.user._id,
      ownerProfileId: profile._id,
      status: 'ACCEPTED',
      accessGrantedUntil: new Date(Date.now() - 60 * 1000),
    });

    const response = await request(app)
      .get(`/api/media/${media.id}/access`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(403);

    expect(bodyAs<{ message: string }>(response).message).toBe(
      'You do not have permission to view this private media',
    );
  });

  it('denies pending, rejected, and withdrawn photo requests even if they still carry a future grant timestamp', async () => {
    const scenarios = ['PENDING', 'REJECTED', 'WITHDRAWN'] as const;

    for (const status of scenarios) {
      const owner = await createUser(`media-owner-${status.toLowerCase()}@example.com`);
      const viewer = await createUser(`media-viewer-${status.toLowerCase()}@example.com`);
      const profile = await createProfile(owner.user._id);
      const media = await createPrivateUploadedMedia(owner.user._id, profile._id);

      await PhotoRequestModel.create({
        requesterId: viewer.user._id,
        ownerId: owner.user._id,
        ownerProfileId: profile._id,
        status,
        accessGrantedUntil: new Date(Date.now() + 60 * 60 * 1000),
      });

      const response = await request(app)
        .get(`/api/media/${media.id}/access`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(403);

      expect(bodyAs<{ message: string }>(response).message).toBe(
        'You do not have permission to view this private media',
      );
    }
  });

  it('ignores a withdrawn request from a later cycle and still requires a currently accepted grant', async () => {
    const owner = await createUser('media-owner-withdraw-cycle@example.com');
    const viewer = await createUser('media-viewer-withdraw-cycle@example.com');
    const profile = await createProfile(owner.user._id);
    const media = await createPrivateUploadedMedia(owner.user._id, profile._id);

    await PhotoRequestModel.create({
      requesterId: viewer.user._id,
      ownerId: owner.user._id,
      ownerProfileId: profile._id,
      status: 'WITHDRAWN',
      accessGrantedUntil: new Date(Date.now() + 60 * 60 * 1000),
    });

    const response = await request(app)
      .get(`/api/media/${media.id}/access`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(403);

    expect(bodyAs<{ message: string }>(response).message).toBe(
      'You do not have permission to view this private media',
    );
  });

  it('denies a viewer with no photo request record at all', async () => {
    const owner = await createUser('media-owner-no-request@example.com');
    const viewer = await createUser('media-viewer-no-request@example.com');
    const profile = await createProfile(owner.user._id);
    const media = await createPrivateUploadedMedia(owner.user._id, profile._id);

    const response = await request(app)
      .get(`/api/media/${media.id}/access`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(403);

    expect(bodyAs<{ message: string }>(response).message).toBe(
      'You do not have permission to view this private media',
    );
  });
});
