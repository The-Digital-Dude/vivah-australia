import path from 'path';
import crypto from 'crypto';
import {
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
  UserRole,
  VerificationStatus,
} from '@vivah/shared';
import type {
  CmsCoverImageUploadInput,
  MediaCompleteUploadInput,
  MediaReviewInput,
  MediaSignUploadInput,
  MediaUpdateInput,
} from '@vivah/shared';
import { Types } from 'mongoose';
import { HttpError } from '../auth/auth-errors.js';
import {
  PhotoRequestModel,
  ProfileMediaModel,
  ProfileModel,
  UserModel,
  type ProfileMediaDocument,
} from '../models/index.js';
import {
  isGcsConfigured,
  makeObjectPrivate,
  makeObjectPublic,
  objectExists,
  publicUrl,
  signedReadUrl,
  signedUploadUrl,
} from '../storage/gcs.js';

const UPLOAD_TTL_SECONDS = 10 * 60;
const ACCESS_TTL_SECONDS = 5 * 60;
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const VIDEO_MAX_DURATION_SECONDS = 120;
const LOCAL_UPLOAD_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
const LOCAL_STORAGE_ROUTE = '/api/mock-gcs-storage/';

const MEDIA_COUNT_LIMITS: Record<MediaCategory, number> = {
  [MediaCategory.PROFILE_PHOTO]: 1,
  [MediaCategory.PUBLIC_GALLERY]: 6,
  [MediaCategory.PRIVATE_GALLERY]: 6,
  [MediaCategory.VIDEO_INTRO]: 1,
};

function isProductionEnv() {
  return process.env.NODE_ENV === 'production';
}

// Real Google Cloud Storage when configured; otherwise a local on-disk mock for
// development (served from /api/mock-gcs-storage). Production requires GCS.
function storageProvider(): 'gcs' | 'mock' {
  if (isGcsConfigured()) {
    return 'gcs';
  }
  if (isProductionEnv()) {
    throw new HttpError(500, 'Google Cloud Storage is required for uploads in production');
  }
  return 'mock';
}

// Only truly-private media is locked down in the bucket. Public and
// matches-only objects are made public-read so their URLs are stable, matching
// how the app already gates access at the application layer.
function isPubliclyReadable(visibility: ProfileMediaDocument['visibility']) {
  return visibility !== MediaVisibility.PRIVATE;
}

function storageKeyFor(userId: Types.ObjectId, category: string) {
  const suffix = crypto.randomBytes(8).toString('hex');
  return `vivah/profiles/${userId.toString()}/${category.toLowerCase()}/${suffix}`;
}

function defaultVisibility(category: MediaCategory) {
  return category === MediaCategory.PRIVATE_GALLERY
    ? MediaVisibility.PRIVATE
    : MediaVisibility.PUBLIC;
}

function accessSecret() {
  return process.env.MEDIA_ACCESS_SECRET ?? process.env.JWT_ACCESS_SECRET ?? 'local-media-access-secret';
}

function localAssetUrl(storageKey: string) {
  return `${LOCAL_UPLOAD_BASE_URL}${LOCAL_STORAGE_ROUTE}${storageKey}`;
}

function initialAssetUrl(provider: 'gcs' | 'mock', storageKey: string) {
  return provider === 'gcs' ? publicUrl(storageKey) : localAssetUrl(storageKey);
}

function categoryByteLimit(category: MediaCategory) {
  return category === MediaCategory.VIDEO_INTRO ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
}

function mediaVariantPath(mediaId: string) {
  return `${LOCAL_UPLOAD_BASE_URL}/api/media/private/${mediaId}`;
}

function signAccessToken(
  mediaId: string,
  viewerId: string,
  variant: 'original' | 'thumbnail' | 'poster',
  expiresAt: number,
) {
  const payload = `${mediaId}.${viewerId}.${variant}.${expiresAt}`;
  const signature = crypto.createHmac('sha256', accessSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

function verifySignedAccessToken(
  mediaId: string,
  viewerId: string,
  variant: 'original' | 'thumbnail' | 'poster',
  token: string,
) {
  let decoded = '';

  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    throw new HttpError(403, 'Invalid media access token');
  }

  const parts = decoded.split('.');
  if (parts.length !== 5) {
    throw new HttpError(403, 'Invalid media access token');
  }

  const [tokenMediaId, tokenViewerId, tokenVariant, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);

  if (
    tokenMediaId !== mediaId ||
    tokenViewerId !== viewerId ||
    tokenVariant !== variant ||
    !Number.isFinite(expiresAt)
  ) {
    throw new HttpError(403, 'Invalid media access token');
  }

  if (expiresAt * 1000 < Date.now()) {
    throw new HttpError(403, 'Media access token has expired');
  }

  const expected = crypto
    .createHmac('sha256', accessSecret())
    .update(`${tokenMediaId}.${tokenViewerId}.${tokenVariant}.${expiresAt}`)
    .digest('hex');

  if (signature !== expected) {
    throw new HttpError(403, 'Invalid media access token');
  }
}

export function createSignedMediaDeliveryUrl(
  media: Pick<ProfileMediaDocument, 'id'>,
  viewerId: string,
  variant: 'original' | 'thumbnail' | 'poster' = 'original',
) {
  const expiresAt = Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS;
  const token = signAccessToken(media.id, viewerId, variant, expiresAt);
  const url = `${mediaVariantPath(media.id)}?variant=${variant}&mediaAccessToken=${encodeURIComponent(token)}`;

  return {
    url,
    token,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  };
}

function publicMedia(media: ProfileMediaDocument) {
  return {
    id: media.id,
    profileId: media.profileId.toString(),
    assetUrl: media.assetUrl,
    storageKey: media.storageKey,
    uploadProvider: media.uploadProvider,
    uploadExpiresAt: media.uploadExpiresAt,
    mediaType: media.mediaType,
    category: media.category,
    uploadStatus: media.uploadStatus,
    mimeType: media.mimeType,
    fileSizeBytes: media.fileSizeBytes,
    originalFilename: media.originalFilename,
    width: media.width,
    height: media.height,
    thumbnailUrl: media.thumbnailUrl,
    videoPosterUrl: media.videoPosterUrl,
    durationSeconds: media.durationSeconds,
    visibility: media.visibility,
    approvalStatus: media.approvalStatus,
    moderationReason: media.moderationReason,
    isPrimary: media.isPrimary,
    reviewedAt: media.reviewedAt,
    createdAt: media.createdAt,
    updatedAt: media.updatedAt,
  };
}

type PublicMedia = ReturnType<typeof publicMedia>;

// Owner and admin views render asset/thumbnail URLs directly. For private GCS
// objects those are not publicly fetchable, so swap in short-lived signed read
// URLs the viewer's browser can load.
async function withDisplayUrls(media: ProfileMediaDocument): Promise<PublicMedia> {
  const dto = publicMedia(media);

  if (
    media.uploadProvider === 'gcs' &&
    media.visibility === MediaVisibility.PRIVATE &&
    media.storageKey &&
    media.uploadStatus === MediaUploadStatus.UPLOADED
  ) {
    const signed = await signedReadUrl(media.storageKey);
    dto.assetUrl = signed;
    dto.thumbnailUrl = signed;
    if (dto.videoPosterUrl) {
      dto.videoPosterUrl = signed;
    }
  }

  return dto;
}

async function getOwnProfileOrFail(userId: Types.ObjectId) {
  const profile = await ProfileModel.findOne({ userId, isDeleted: false });

  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }

  return profile;
}

async function getOwnMediaOrFail(userId: Types.ObjectId, mediaId: string) {
  if (!Types.ObjectId.isValid(mediaId)) {
    throw new HttpError(404, 'Media not found');
  }

  const media = await ProfileMediaModel.findOne({ _id: mediaId, userId, isDeleted: false });

  if (!media) {
    throw new HttpError(404, 'Media not found');
  }

  return media;
}

async function assertMediaCountLimit(profileId: Types.ObjectId, category: MediaCategory) {
  const existingCount = await ProfileMediaModel.countDocuments({
    profileId,
    category,
    isDeleted: false,
    uploadStatus: { $ne: MediaUploadStatus.FAILED },
  });

  if (existingCount >= MEDIA_COUNT_LIMITS[category]) {
    throw new HttpError(400, `Media limit reached for ${category.replaceAll('_', ' ').toLowerCase()}`);
  }
}

function validateCompletionSize(media: ProfileMediaDocument, input: MediaCompleteUploadInput) {
  if (input.bytes === undefined) {
    return;
  }

  const limit = categoryByteLimit(media.category);
  if (input.bytes > limit) {
    throw new HttpError(
      400,
      media.category === MediaCategory.VIDEO_INTRO
        ? 'Video intro files must be under 50MB'
        : 'Image files must be under 10MB',
    );
  }
}

// Resolves the final asset URL for a completed upload and applies the correct
// bucket-object access level. Trusts the server-known storage key rather than a
// client-supplied URL.
async function finalizeUploadedObject(media: ProfileMediaDocument, input: MediaCompleteUploadInput) {
  if (!media.uploadProvider || !media.storageKey) {
    throw new HttpError(400, 'Upload metadata is incomplete');
  }

  if (input.storageKey && input.storageKey !== media.storageKey) {
    throw new HttpError(400, 'Upload storage key does not match the signed upload');
  }

  if (media.uploadProvider === 'gcs') {
    if (!(await objectExists(media.storageKey))) {
      throw new HttpError(400, 'Upload was not found in storage');
    }

    if (isPubliclyReadable(media.visibility)) {
      await makeObjectPublic(media.storageKey);
    } else {
      await makeObjectPrivate(media.storageKey);
    }

    return publicUrl(media.storageKey);
  }

  // Local mock storage (development only).
  if (isProductionEnv()) {
    throw new HttpError(400, 'Mock storage uploads are not allowed in production');
  }

  const expectedUrl = localAssetUrl(media.storageKey);
  if (input.assetUrl.split('?')[0] !== expectedUrl) {
    throw new HttpError(400, 'Upload asset URL does not match the signed upload target');
  }

  return expectedUrl;
}

async function ensurePrivateMediaAccess(viewerId: Types.ObjectId, media: ProfileMediaDocument) {
  if (String(media.userId) === String(viewerId)) {
    return;
  }

  const viewer = await UserModel.findById(viewerId).lean();
  if (
    viewer?.role === UserRole.ADMIN ||
    viewer?.role === UserRole.SUPER_ADMIN ||
    viewer?.role === UserRole.MODERATOR
  ) {
    return;
  }

  const now = new Date();
  const activeGrant = await PhotoRequestModel.findOne({
    requesterId: viewerId,
    ownerId: media.userId,
    status: 'ACCEPTED',
    accessGrantedUntil: { $gt: now },
    isDeleted: false,
  }).lean();

  if (!activeGrant) {
    throw new HttpError(403, 'You do not have permission to view this private media');
  }
}

export async function resolveMediaDelivery(
  viewerId: Types.ObjectId,
  mediaId: string,
  mediaAccessToken: string,
  variant: 'original' | 'thumbnail' | 'poster',
) {
  if (!Types.ObjectId.isValid(mediaId)) {
    throw new HttpError(404, 'Media not found');
  }

  verifySignedAccessToken(mediaId, viewerId.toString(), variant, mediaAccessToken);

  const media = await ProfileMediaModel.findOne({ _id: mediaId, isDeleted: false });
  if (!media) {
    throw new HttpError(404, 'Media not found');
  }

  if (media.uploadStatus !== MediaUploadStatus.UPLOADED) {
    throw new HttpError(404, 'Media not available');
  }

  if (media.approvalStatus !== VerificationStatus.APPROVED) {
    throw new HttpError(403, 'Media has not been approved');
  }

  if (media.visibility !== MediaVisibility.PRIVATE) {
    throw new HttpError(400, 'Signed delivery is only available for private media');
  }

  await ensurePrivateMediaAccess(viewerId, media);

  if (media.uploadProvider === 'gcs' && media.storageKey) {
    // GCS objects (thumbnail/poster are the same object) are delivered via a
    // short-lived signed read URL. No server-side variant transforms.
    const signedUrl = await signedReadUrl(media.storageKey);
    return {
      mode: 'redirect' as const,
      assetUrl: signedUrl,
    };
  }

  if (media.uploadProvider === 'mock' && media.storageKey) {
    return {
      mode: 'local' as const,
      filePath: path.join(process.cwd(), 'uploads', media.storageKey),
      mimeType: media.mimeType,
    };
  }

  return {
    mode: 'redirect' as const,
    assetUrl: media.assetUrl,
  };
}

export async function createSignedMediaUpload(userId: Types.ObjectId, input: MediaSignUploadInput) {
  const profile = await getOwnProfileOrFail(userId);
  await assertMediaCountLimit(profile._id, input.category);

  const storageKey = storageKeyFor(userId, input.category);
  const visibility = input.visibility ?? defaultVisibility(input.category);
  const expiresAt = new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000);
  const isVideo = input.category === MediaCategory.VIDEO_INTRO;
  const provider = storageProvider();

  const media = await ProfileMediaModel.create({
    userId,
    profileId: profile._id,
    assetUrl: initialAssetUrl(provider, storageKey),
    storageKey,
    uploadProvider: provider,
    uploadExpiresAt: expiresAt,
    mediaType: isVideo ? 'VIDEO' : 'PHOTO',
    category: input.category,
    uploadStatus: MediaUploadStatus.SIGNED,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    originalFilename: input.fileName,
    visibility,
    approvalStatus: VerificationStatus.PENDING,
    isPrimary: input.category === MediaCategory.PROFILE_PHOTO,
  });

  const url =
    provider === 'gcs'
      ? await signedUploadUrl(storageKey, input.mimeType)
      : localAssetUrl(storageKey);

  return {
    media: publicMedia(media),
    upload: {
      provider,
      method: 'PUT' as const,
      url,
      expiresAt: expiresAt.toISOString(),
      fields: {
        storageKey,
      },
    },
  };
}

export async function createSignedCmsImageUpload(input: CmsCoverImageUploadInput) {
  if (input.fileSizeBytes > IMAGE_MAX_BYTES) {
    throw new HttpError(400, 'Cover image must be 10MB or smaller');
  }

  const suffix = crypto.randomBytes(8).toString('hex');
  const storageKey = `vivah/cms/blogs/${suffix}`;
  const expiresAt = new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000);
  const provider = storageProvider();

  if (provider === 'gcs') {
    // Blog covers are always public and have no completion step, so the object
    // is made public-read at upload time via the signed ACL header.
    const url = await signedUploadUrl(storageKey, input.mimeType, { publicRead: true });
    return {
      upload: {
        provider: 'gcs' as const,
        method: 'PUT' as const,
        url,
        assetUrl: publicUrl(storageKey),
        expiresAt: expiresAt.toISOString(),
        fields: { storageKey },
      },
    };
  }

  const url = localAssetUrl(storageKey);
  return {
    upload: {
      provider: 'mock' as const,
      method: 'PUT' as const,
      url,
      assetUrl: url,
      expiresAt: expiresAt.toISOString(),
      fields: { storageKey },
    },
  };
}

export async function completeMediaUpload(userId: Types.ObjectId, input: MediaCompleteUploadInput) {
  const media = await getOwnMediaOrFail(userId, input.mediaId);

  if (media.uploadStatus !== MediaUploadStatus.SIGNED) {
    throw new HttpError(400, 'Media upload is not awaiting completion');
  }

  if (!media.uploadExpiresAt || media.uploadExpiresAt.getTime() < Date.now()) {
    throw new HttpError(400, 'Signed upload has expired');
  }

  validateCompletionSize(media, input);
  const assetUrl = await finalizeUploadedObject(media, input);

  if (media.category === MediaCategory.VIDEO_INTRO) {
    if (!input.durationSeconds) {
      throw new HttpError(400, 'Video duration is required');
    }
    if (input.durationSeconds > VIDEO_MAX_DURATION_SECONDS) {
      throw new HttpError(400, `Video intro must be ${VIDEO_MAX_DURATION_SECONDS} seconds or shorter`);
    }
    media.durationSeconds = input.durationSeconds;
  }

  media.assetUrl = assetUrl;
  media.uploadStatus = MediaUploadStatus.UPLOADED;
  media.fileSizeBytes = input.bytes ?? media.fileSizeBytes;
  if (input.width) {
    media.width = input.width;
  }
  if (input.height) {
    media.height = input.height;
  }
  // GCS/mock storage has no server-side transforms: the original doubles as the
  // thumbnail and video poster.
  media.thumbnailUrl = assetUrl;
  if (media.mediaType === 'VIDEO') {
    media.videoPosterUrl = assetUrl;
  } else {
    media.set('videoPosterUrl', undefined);
  }
  media.approvalStatus = VerificationStatus.PENDING;
  media.set('moderationReason', undefined);
  await media.save();

  return publicMedia(media);
}

export async function listOwnMedia(userId: Types.ObjectId) {
  const media = await ProfileMediaModel.find({ userId, isDeleted: false })
    .sort({ isPrimary: -1, createdAt: -1 })
    .exec();
  return Promise.all(media.map((item) => withDisplayUrls(item)));
}

export async function updateOwnMedia(
  userId: Types.ObjectId,
  mediaId: string,
  input: MediaUpdateInput,
) {
  const media = await getOwnMediaOrFail(userId, mediaId);

  if (input.visibility) {
    media.visibility = input.visibility;

    // Keep the bucket object's access level in sync with visibility changes.
    if (
      media.uploadProvider === 'gcs' &&
      media.storageKey &&
      media.uploadStatus === MediaUploadStatus.UPLOADED
    ) {
      if (isPubliclyReadable(input.visibility)) {
        await makeObjectPublic(media.storageKey);
      } else {
        await makeObjectPrivate(media.storageKey);
      }
    }
  }

  if (input.isPrimary !== undefined) {
    media.isPrimary = input.isPrimary;
    if (input.isPrimary) {
      await ProfileMediaModel.updateMany(
        {
          userId,
          _id: { $ne: media._id },
          category: MediaCategory.PROFILE_PHOTO,
          isDeleted: false,
        },
        { $set: { isPrimary: false } },
      );
      media.category = MediaCategory.PROFILE_PHOTO;
    }
  }

  await media.save();
  return withDisplayUrls(media);
}

export async function deleteOwnMedia(userId: Types.ObjectId, mediaId: string) {
  const media = await getOwnMediaOrFail(userId, mediaId);
  media.isDeleted = true;
  media.deletedAt = new Date();
  await media.save();
}

export async function createMediaAccess(userId: Types.ObjectId, mediaId: string) {
  if (!Types.ObjectId.isValid(mediaId)) {
    throw new HttpError(404, 'Media not found');
  }

  const media = await ProfileMediaModel.findOne({ _id: mediaId, isDeleted: false });
  if (!media) {
    throw new HttpError(404, 'Media not found');
  }

  if (media.uploadStatus !== MediaUploadStatus.UPLOADED) {
    throw new HttpError(400, 'Media has not been uploaded');
  }

  if (media.visibility === MediaVisibility.PRIVATE) {
    await ensurePrivateMediaAccess(userId, media);
    const access = createSignedMediaDeliveryUrl(media, userId.toString());

    return {
      media: publicMedia(media),
      access,
    };
  }

  return {
    media: publicMedia(media),
    access: {
      expiresAt: new Date(Date.now() + ACCESS_TTL_SECONDS * 1000).toISOString(),
      url: media.assetUrl,
      token: null,
    },
  };
}

export async function listMediaForReview(status?: string) {
  const filter: Record<string, unknown> = { isDeleted: false };

  if (status) {
    filter.approvalStatus = status;
  }

  const media = await ProfileMediaModel.find(filter)
    .sort({ createdAt: 1 })
    .limit(100)
    .populate('profileId', 'displayId personal.firstName personal.lastName')
    .lean();

  // Moderators must be able to preview private GCS objects, which are not
  // public-read; hand them short-lived signed URLs.
  return Promise.all(
    media.map(async (doc) => {
      if (
        doc.uploadProvider === 'gcs' &&
        doc.visibility === MediaVisibility.PRIVATE &&
        doc.storageKey &&
        doc.uploadStatus === MediaUploadStatus.UPLOADED
      ) {
        const signed = await signedReadUrl(doc.storageKey);
        return {
          ...doc,
          assetUrl: signed,
          thumbnailUrl: signed,
          ...(doc.videoPosterUrl ? { videoPosterUrl: signed } : {}),
        };
      }
      return doc;
    }),
  );
}

export async function reviewMedia(
  reviewerId: Types.ObjectId,
  mediaId: string,
  input: MediaReviewInput,
) {
  if (!Types.ObjectId.isValid(mediaId)) {
    throw new HttpError(404, 'Media not found');
  }

  const media = await ProfileMediaModel.findOne({ _id: mediaId, isDeleted: false });

  if (!media) {
    throw new HttpError(404, 'Media not found');
  }

  media.approvalStatus = input.approvalStatus;
  if (input.reason) {
    media.moderationReason = input.reason;
  } else {
    media.set('moderationReason', undefined);
  }
  media.reviewedBy = reviewerId;
  media.reviewedAt = new Date();
  await media.save();

  return publicMedia(media);
}
