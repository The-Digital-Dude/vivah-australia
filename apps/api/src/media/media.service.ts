import crypto from 'crypto';
import path from 'path';
import {
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
  UserRole,
  VerificationStatus,
} from '@vivah/shared';
import type {
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

function envValue(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function isProductionEnv() {
  return process.env.NODE_ENV === 'production';
}

function cloudinaryConfig() {
  const cloudName = envValue('CLOUDINARY_CLOUD_NAME');
  const apiKey = envValue('CLOUDINARY_API_KEY');
  const apiSecret = envValue('CLOUDINARY_API_SECRET');

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

function requireCloudinaryConfig() {
  const config = cloudinaryConfig();
  if (!config) {
    throw new HttpError(500, 'Cloudinary is required for media uploads in production');
  }
  return config;
}

function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== '' && value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
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

function publicIdFromStorageKey(storageKey: string) {
  return storageKey.split('/').at(-1) ?? storageKey;
}

function insertCloudinaryTransform(assetUrl: string, transform: string) {
  return assetUrl.replace('/upload/', `/upload/${transform}/`);
}

function deriveThumbnailUrl(provider: 'cloudinary' | 'gcs', assetUrl: string, mediaType: 'PHOTO' | 'VIDEO') {
  if (provider === 'cloudinary') {
    if (mediaType === 'VIDEO') {
      return insertCloudinaryTransform(assetUrl, 'so_0,f_jpg,w_640,c_fill,q_auto');
    }
    return insertCloudinaryTransform(assetUrl, 'f_auto,q_auto,w_640,c_limit');
  }

  return assetUrl;
}

function deriveVideoPosterUrl(provider: 'cloudinary' | 'gcs', assetUrl: string) {
  if (provider === 'cloudinary') {
    return insertCloudinaryTransform(assetUrl, 'so_0,f_jpg,w_960,c_fill,q_auto');
  }

  return assetUrl;
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

function assertProviderAssetUrl(media: ProfileMediaDocument, input: MediaCompleteUploadInput) {
  if (!media.uploadProvider || !media.storageKey) {
    throw new HttpError(400, 'Upload metadata is incomplete');
  }

  if (input.storageKey && input.storageKey !== media.storageKey) {
    throw new HttpError(400, 'Upload storage key does not match the signed upload');
  }

  if (media.uploadProvider === 'gcs') {
    if (isProductionEnv()) {
      throw new HttpError(400, 'Mock storage uploads are not allowed in production');
    }

    const expectedUrl = localAssetUrl(media.storageKey);
    if (input.assetUrl.split('?')[0] !== expectedUrl) {
      throw new HttpError(400, 'Upload asset URL does not match the signed upload target');
    }
    return;
  }

  const cloudinary = requireCloudinaryConfig();
  const parsed = new URL(input.assetUrl);
  const hostOk = parsed.hostname === 'res.cloudinary.com' || parsed.hostname.endsWith('.cloudinary.com');
  const decodedPath = decodeURIComponent(parsed.pathname);

  if (
    !hostOk ||
    !decodedPath.includes(`/${cloudinary.cloudName}/`) ||
    !decodedPath.includes(media.storageKey)
  ) {
    throw new HttpError(400, 'Upload asset URL does not match the signed Cloudinary upload');
  }
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

function deliveryAssetForVariant(
  media: ProfileMediaDocument,
  variant: 'original' | 'thumbnail' | 'poster',
) {
  if (variant === 'thumbnail' && media.thumbnailUrl) {
    return media.thumbnailUrl;
  }

  if (variant === 'poster' && media.videoPosterUrl) {
    return media.videoPosterUrl;
  }

  return media.assetUrl;
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

  const assetUrl = deliveryAssetForVariant(media, variant);
  if (media.uploadProvider === 'gcs' && media.storageKey) {
    return {
      mode: 'local' as const,
      filePath: path.join(process.cwd(), 'uploads', media.storageKey),
      mimeType: media.mimeType,
    };
  }

  return {
    mode: 'redirect' as const,
    assetUrl,
  };
}

export async function createSignedMediaUpload(userId: Types.ObjectId, input: MediaSignUploadInput) {
  const profile = await getOwnProfileOrFail(userId);
  await assertMediaCountLimit(profile._id, input.category);

  const storageKey = storageKeyFor(userId, input.category);
  const visibility = input.visibility ?? defaultVisibility(input.category);
  const expiresAt = new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000);
  const isVideo = input.category === MediaCategory.VIDEO_INTRO;
  const cloudinary = isProductionEnv() ? requireCloudinaryConfig() : cloudinaryConfig();

  const provider: 'cloudinary' | 'gcs' = cloudinary ? 'cloudinary' : 'gcs';
  const media = await ProfileMediaModel.create({
    userId,
    profileId: profile._id,
    assetUrl: localAssetUrl(storageKey),
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

  if (!cloudinary) {
    return {
      media: publicMedia(media),
      upload: {
        provider: 'gcs' as const,
        method: 'PUT' as const,
        url: localAssetUrl(storageKey),
        expiresAt: expiresAt.toISOString(),
        fields: {
          storageKey,
        },
      },
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = storageKey.split('/').slice(0, -1).join('/');
  const publicId = publicIdFromStorageKey(storageKey);
  const params = {
    folder,
    public_id: publicId,
    timestamp,
    context: `media_id=${media.id}|user_id=${userId.toString()}`,
  };
  const signature = signCloudinaryParams(params, cloudinary.apiSecret);

  return {
    media: publicMedia(media),
    upload: {
      provider: 'cloudinary' as const,
      method: 'POST' as const,
      url: `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/${isVideo ? 'video' : 'image'}/upload`,
      expiresAt: expiresAt.toISOString(),
      fields: {
        ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])),
        api_key: cloudinary.apiKey,
        signature,
      },
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
  assertProviderAssetUrl(media, input);

  if (media.category === MediaCategory.VIDEO_INTRO) {
    if (!input.durationSeconds) {
      throw new HttpError(400, 'Video duration is required');
    }
    if (input.durationSeconds > VIDEO_MAX_DURATION_SECONDS) {
      throw new HttpError(400, `Video intro must be ${VIDEO_MAX_DURATION_SECONDS} seconds or shorter`);
    }
    media.durationSeconds = input.durationSeconds;
  }

  media.assetUrl = input.assetUrl;
  media.uploadStatus = MediaUploadStatus.UPLOADED;
  media.fileSizeBytes = input.bytes ?? media.fileSizeBytes;
  if (input.width) {
    media.width = input.width;
  }
  if (input.height) {
    media.height = input.height;
  }
  media.thumbnailUrl = deriveThumbnailUrl(media.uploadProvider ?? 'gcs', input.assetUrl, media.mediaType);
  if (media.mediaType === 'VIDEO') {
    media.videoPosterUrl = deriveVideoPosterUrl(media.uploadProvider ?? 'gcs', input.assetUrl);
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
  return media.map(publicMedia);
}

export async function updateOwnMedia(
  userId: Types.ObjectId,
  mediaId: string,
  input: MediaUpdateInput,
) {
  const media = await getOwnMediaOrFail(userId, mediaId);

  if (input.visibility) {
    media.visibility = input.visibility;
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
  return publicMedia(media);
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

  return media;
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
