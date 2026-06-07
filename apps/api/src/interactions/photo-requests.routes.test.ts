import request from 'supertest';
import type { Response } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  AccountStatus,
  Gender,
  InterestStatus,
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
  UserRole,
  VerificationStatus,
} from '@vivah/shared';
import { createApp } from '../app.js';
import { createTokenPair } from '../auth/token.service.js';
import type { AuthConfig } from '../auth/auth-types.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  InterestModel,
  PhotoRequestModel,
  ProfileApprovalStatus,
  ProfileMediaModel,
  ProfileModel,
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

async function addPrivateMedia(userId: mongoose.Types.ObjectId, profileId: mongoose.Types.ObjectId, assetUrl: string) {
  return ProfileMediaModel.create({
    userId,
    profileId,
    assetUrl,
    storageKey: `private-${profileId.toString()}`,
    mediaType: 'PHOTO',
    category: MediaCategory.PRIVATE_GALLERY,
    uploadStatus: MediaUploadStatus.UPLOADED,
    mimeType: 'image/jpeg',
    fileSizeBytes: 200000,
    originalFilename: 'private.jpg',
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

describe('photo requests & private gallery media access', () => {
  it('denies access if no photo request or mutual accepted interest exists', async () => {
    const requester = await createUser('requester@example.com');
    const owner = await createUser('owner@example.com');
    const ownerProfile = await createProfile(owner.user._id, 'VA400001', 'Priya', Gender.FEMALE);
    await addPrivateMedia(owner.user._id, ownerProfile._id, 'https://cdn.example.com/priya-private.jpg');

    await request(app)
      .get(`/api/profiles/${ownerProfile._id.toString()}/private-gallery`)
      .set('Authorization', `Bearer ${requester.accessToken}`)
      .expect(403);

    const statusRes = await request(app)
      .get(`/api/me/photo-requests/status/${ownerProfile._id.toString()}`)
      .set('Authorization', `Bearer ${requester.accessToken}`)
      .expect(200);
    expect(bodyAs<{ hasAccess: boolean }>(statusRes).hasAccess).toBe(false);
  });

  it('allows access and lists private photos if an accepted photo request exists', async () => {
    const requester = await createUser('requester2@example.com');
    const owner = await createUser('owner2@example.com');
    const ownerProfile = await createProfile(owner.user._id, 'VA400002', 'Priya', Gender.FEMALE);
    await addPrivateMedia(owner.user._id, ownerProfile._id, 'https://cdn.example.com/priya-private.jpg');

    // Create accepted photo request
    const grantUntil = new Date();
    grantUntil.setDate(grantUntil.getDate() + 30);
    await PhotoRequestModel.create({
      requesterId: requester.user._id,
      ownerId: owner.user._id,
      ownerProfileId: ownerProfile._id,
      status: 'ACCEPTED',
      accessGrantedUntil: grantUntil,
    });

    const galleryRes = await request(app)
      .get(`/api/profiles/${ownerProfile._id.toString()}/private-gallery`)
      .set('Authorization', `Bearer ${requester.accessToken}`)
      .expect(200);
    const photos = bodyAs<{ photos: { assetUrl: string }[] }>(galleryRes).photos;
    expect(photos).toHaveLength(1);
    expect(photos[0].assetUrl).toBe('https://cdn.example.com/priya-private.jpg');

    const statusRes = await request(app)
      .get(`/api/me/photo-requests/status/${ownerProfile._id.toString()}`)
      .set('Authorization', `Bearer ${requester.accessToken}`)
      .expect(200);
    expect(bodyAs<{ hasAccess: boolean }>(statusRes).hasAccess).toBe(true);
  });

  it('allows access and lists private photos if a mutual accepted interest exists', async () => {
    const requester = await createUser('requester3@example.com');
    const owner = await createUser('owner3@example.com');
    const ownerProfile = await createProfile(owner.user._id, 'VA400003', 'Priya', Gender.FEMALE);
    await addPrivateMedia(owner.user._id, ownerProfile._id, 'https://cdn.example.com/priya-private.jpg');

    // Create mutual accepted interest
    await InterestModel.create({
      senderId: requester.user._id,
      receiverId: owner.user._id,
      status: InterestStatus.ACCEPTED,
    });

    const galleryRes = await request(app)
      .get(`/api/profiles/${ownerProfile._id.toString()}/private-gallery`)
      .set('Authorization', `Bearer ${requester.accessToken}`)
      .expect(200);
    const photos = bodyAs<{ photos: { assetUrl: string }[] }>(galleryRes).photos;
    expect(photos).toHaveLength(1);
    expect(photos[0].assetUrl).toBe('https://cdn.example.com/priya-private.jpg');

    const statusRes = await request(app)
      .get(`/api/me/photo-requests/status/${ownerProfile._id.toString()}`)
      .set('Authorization', `Bearer ${requester.accessToken}`)
      .expect(200);
    expect(bodyAs<{ hasAccess: boolean }>(statusRes).hasAccess).toBe(true);
  });

  it('allows owner access to their own private gallery without restrictions', async () => {
    const owner = await createUser('owner4@example.com');
    const ownerProfile = await createProfile(owner.user._id, 'VA400004', 'Priya', Gender.FEMALE);
    await addPrivateMedia(owner.user._id, ownerProfile._id, 'https://cdn.example.com/priya-private.jpg');

    const galleryRes = await request(app)
      .get(`/api/profiles/${ownerProfile._id.toString()}/private-gallery`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(bodyAs<{ photos: unknown[] }>(galleryRes).photos).toHaveLength(1);

    const statusRes = await request(app)
      .get(`/api/me/photo-requests/status/${ownerProfile._id.toString()}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(bodyAs<{ hasAccess: boolean }>(statusRes).hasAccess).toBe(true);
  });

  it('allows admin access to view private gallery', async () => {
    const requester = await createUser('admin-viewer@example.com', UserRole.ADMIN);
    const owner = await createUser('owner5@example.com');
    const ownerProfile = await createProfile(owner.user._id, 'VA400005', 'Priya', Gender.FEMALE);
    await addPrivateMedia(owner.user._id, ownerProfile._id, 'https://cdn.example.com/priya-private.jpg');

    const galleryRes = await request(app)
      .get(`/api/profiles/${ownerProfile._id.toString()}/private-gallery`)
      .set('Authorization', `Bearer ${requester.accessToken}`)
      .expect(200);
    expect(bodyAs<{ photos: unknown[] }>(galleryRes).photos).toHaveLength(1);

    const statusRes = await request(app)
      .get(`/api/me/photo-requests/status/${ownerProfile._id.toString()}`)
      .set('Authorization', `Bearer ${requester.accessToken}`)
      .expect(200);
    expect(bodyAs<{ hasAccess: boolean }>(statusRes).hasAccess).toBe(true);
  });
});
