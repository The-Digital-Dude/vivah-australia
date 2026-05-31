import crypto from 'crypto';
import {
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
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
import { ProfileMediaModel, ProfileModel, type ProfileMediaDocument } from '../models/index.js';

const UPLOAD_TTL_SECONDS = 10 * 60;
const ACCESS_TTL_SECONDS = 5 * 60;
const LOCAL_UPLOAD_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';

function envValue(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
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
  return (
    process.env.MEDIA_ACCESS_SECRET ?? process.env.JWT_ACCESS_SECRET ?? 'local-media-access-secret'
  );
}

function signAccessToken(mediaId: string, viewerId: string, expiresAt: number) {
  const payload = `${mediaId}.${viewerId}.${expiresAt}`;
  const signature = crypto.createHmac('sha256', accessSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

function publicMedia(media: ProfileMediaDocument) {
  return {
    id: media.id,
    profileId: media.profileId.toString(),
    assetUrl: media.assetUrl,
    storageKey: media.storageKey,
    mediaType: media.mediaType,
    category: media.category,
    uploadStatus: media.uploadStatus,
    mimeType: media.mimeType,
    fileSizeBytes: media.fileSizeBytes,
    originalFilename: media.originalFilename,
    width: media.width,
    height: media.height,
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

export async function createSignedMediaUpload(userId: Types.ObjectId, input: MediaSignUploadInput) {
  const profile = await getOwnProfileOrFail(userId);
  const storageKey = storageKeyFor(userId, input.category);
  const visibility = input.visibility ?? defaultVisibility(input.category);
  const cloudinary = cloudinaryConfig();
  const expiresAt = new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000);

  const media = await ProfileMediaModel.create({
    userId,
    profileId: profile._id,
    assetUrl: `${LOCAL_UPLOAD_BASE_URL}/api/media/${storageKey}`,
    storageKey,
    mediaType: 'PHOTO',
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
    const timestamp = Math.floor(Date.now() / 1000);
    return {
      media: publicMedia(media),
      upload: {
        provider: 'mock',
        method: 'POST',
        url: `${LOCAL_UPLOAD_BASE_URL}/api/mock-storage/upload`,
        expiresAt: expiresAt.toISOString(),
        fields: {
          public_id: storageKey,
          timestamp: String(timestamp),
          signature: signAccessToken(
            media.id,
            userId.toString(),
            Math.floor(expiresAt.getTime() / 1000),
          ),
        },
      },
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = storageKey.split('/').slice(0, -1).join('/');
  const publicId = storageKey.split('/').at(-1) ?? media.id;
  const uploadType = visibility === MediaVisibility.PRIVATE ? 'authenticated' : 'upload';
  const params = {
    folder,
    public_id: publicId,
    timestamp,
    type: uploadType,
    context: `media_id=${media.id}|user_id=${userId.toString()}`,
  };
  const signature = signCloudinaryParams(params, cloudinary.apiSecret);

  return {
    media: publicMedia(media),
    upload: {
      provider: 'cloudinary',
      method: 'POST',
      url: `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`,
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
  media.assetUrl = input.assetUrl;
  if (input.storageKey) {
    media.storageKey = input.storageKey;
  }
  media.uploadStatus = MediaUploadStatus.UPLOADED;
  media.fileSizeBytes = input.bytes ?? media.fileSizeBytes;
  if (input.width) {
    media.width = input.width;
  }
  if (input.height) {
    media.height = input.height;
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
  const media = await getOwnMediaOrFail(userId, mediaId);

  if (media.uploadStatus !== MediaUploadStatus.UPLOADED) {
    throw new HttpError(400, 'Media has not been uploaded');
  }

  const expiresAt = Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS;
  const token = signAccessToken(media.id, userId.toString(), expiresAt);
  const separator = media.assetUrl.includes('?') ? '&' : '?';

  return {
    media: publicMedia(media),
    access: {
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      url: `${media.assetUrl}${separator}mediaAccessToken=${token}`,
      token,
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
