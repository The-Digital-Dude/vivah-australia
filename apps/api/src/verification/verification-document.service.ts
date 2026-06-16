import crypto from 'crypto';
import path from 'path';
import { MediaUploadStatus, UserRole } from '@vivah/shared';
import type {
  VerificationDocumentCompleteUploadInput,
  VerificationDocumentSignUploadInput,
} from '@vivah/shared';
import { Types, type HydratedDocument } from 'mongoose';
import { HttpError } from '../auth/auth-errors.js';
import { UserModel, VerificationDocumentModel, type VerificationDocument } from '../models/index.js';

const UPLOAD_TTL_SECONDS = 10 * 60;
const ACCESS_TTL_SECONDS = 5 * 60;
const LOCAL_UPLOAD_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
const LOCAL_STORAGE_ROUTE = '/api/mock-gcs-storage/';

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
    throw new HttpError(500, 'Cloudinary is required for verification document uploads in production');
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

function storageKeyFor(userId: Types.ObjectId) {
  const suffix = crypto.randomBytes(8).toString('hex');
  return `vivah/verifications/${userId.toString()}/${suffix}`;
}

function localAssetUrl(storageKey: string) {
  return `${LOCAL_UPLOAD_BASE_URL}${LOCAL_STORAGE_ROUTE}${storageKey}`;
}

function accessSecret() {
  return process.env.VERIFICATION_DOCUMENT_ACCESS_SECRET ??
    process.env.MEDIA_ACCESS_SECRET ??
    process.env.JWT_ACCESS_SECRET ??
    'local-verification-document-access-secret';
}

function signPreviewToken(documentId: string, requestId: string, actorId: string, expiresAt: number) {
  const payload = `${documentId}.${requestId}.${actorId}.${expiresAt}`;
  const signature = crypto.createHmac('sha256', accessSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

function verifyPreviewToken(documentId: string, requestId: string, actorId: string, token: string) {
  let decoded = '';
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    throw new HttpError(403, 'Invalid verification document token');
  }

  const parts = decoded.split('.');
  if (parts.length !== 5) {
    throw new HttpError(403, 'Invalid verification document token');
  }

  const [tokenDocumentId, tokenRequestId, tokenActorId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (
    tokenDocumentId !== documentId ||
    tokenRequestId !== requestId ||
    tokenActorId !== actorId ||
    !Number.isFinite(expiresAt)
  ) {
    throw new HttpError(403, 'Invalid verification document token');
  }

  if (expiresAt * 1000 < Date.now()) {
    throw new HttpError(403, 'Verification document token has expired');
  }

  const expected = crypto
    .createHmac('sha256', accessSecret())
    .update(`${tokenDocumentId}.${tokenRequestId}.${tokenActorId}.${expiresAt}`)
    .digest('hex');

  if (signature !== expected) {
    throw new HttpError(403, 'Invalid verification document token');
  }
}

function publicVerificationDocument(document: HydratedDocument<VerificationDocument>) {
  return {
    id: document.id,
    requestId: document.requestId?.toString(),
    userId: document.userId.toString(),
    documentType: document.documentType,
    uploadProvider: document.uploadProvider,
    uploadExpiresAt: document.uploadExpiresAt,
    uploadStatus: document.uploadStatus,
    mimeType: document.mimeType,
    fileSizeBytes: document.fileSizeBytes,
    originalFilename: document.originalFilename,
    encrypted: document.encrypted,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

async function getOwnVerificationDocumentOrFail(userId: Types.ObjectId, documentId: string) {
  if (!Types.ObjectId.isValid(documentId)) {
    throw new HttpError(404, 'Verification document not found');
  }

  const document = await VerificationDocumentModel.findOne({
    _id: documentId,
    userId,
    isDeleted: false,
  });

  if (!document) {
    throw new HttpError(404, 'Verification document not found');
  }

  return document;
}

export async function createSignedVerificationDocumentUpload(
  userId: Types.ObjectId,
  input: VerificationDocumentSignUploadInput,
) {
  const user = await UserModel.findOne({ _id: userId, isDeleted: false });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const storageKey = storageKeyFor(userId);
  const expiresAt = new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000);
  const cloudinary = isProductionEnv() ? requireCloudinaryConfig() : cloudinaryConfig();
  const provider: 'cloudinary' | 'gcs' = cloudinary ? 'cloudinary' : 'gcs';
  const document = await VerificationDocumentModel.create({
    userId,
    documentType: input.documentType,
    storageKey,
    assetUrl: localAssetUrl(storageKey),
    uploadProvider: provider,
    uploadExpiresAt: expiresAt,
    uploadStatus: MediaUploadStatus.SIGNED,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    originalFilename: input.fileName,
    encrypted: true,
  });

  if (!cloudinary) {
    return {
      document: publicVerificationDocument(document),
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
  const publicId = storageKey.split('/').at(-1) ?? document.id;
  const params = {
    folder,
    public_id: publicId,
    timestamp,
    type: 'authenticated',
    context: `verification_document_id=${document.id}|user_id=${userId.toString()}`,
  };
  const signature = signCloudinaryParams(params, cloudinary.apiSecret);

  return {
    document: publicVerificationDocument(document),
    upload: {
      provider: 'cloudinary' as const,
      method: 'POST' as const,
      url: `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/auto/upload`,
      expiresAt: expiresAt.toISOString(),
      fields: {
        ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])),
        api_key: cloudinary.apiKey,
        signature,
      },
    },
  };
}

export async function completeSignedVerificationDocumentUpload(
  userId: Types.ObjectId,
  input: VerificationDocumentCompleteUploadInput,
) {
  const document = await getOwnVerificationDocumentOrFail(userId, input.documentId);

  if (document.uploadStatus !== MediaUploadStatus.SIGNED) {
    throw new HttpError(400, 'Verification document upload is not awaiting completion');
  }

  if (!document.uploadExpiresAt || document.uploadExpiresAt.getTime() < Date.now()) {
    throw new HttpError(400, 'Signed verification document upload has expired');
  }

  if (!document.uploadProvider || !document.storageKey) {
    throw new HttpError(400, 'Verification document upload metadata is incomplete');
  }

  if (input.storageKey && input.storageKey !== document.storageKey) {
    throw new HttpError(400, 'Verification document storage key does not match the signed upload');
  }

  if (document.uploadProvider === 'gcs') {
    if (isProductionEnv()) {
      throw new HttpError(400, 'Mock storage uploads are not allowed in production');
    }

    if (input.assetUrl.split('?')[0] !== localAssetUrl(document.storageKey)) {
      throw new HttpError(400, 'Verification document asset URL does not match the signed upload target');
    }
  } else {
    const cloudinary = requireCloudinaryConfig();
    const parsed = new URL(input.assetUrl);
    const decodedPath = decodeURIComponent(parsed.pathname);
    if (
      parsed.hostname !== 'res.cloudinary.com' &&
      !parsed.hostname.endsWith('.cloudinary.com')
    ) {
      throw new HttpError(400, 'Invalid verification document asset URL');
    }
    if (!decodedPath.includes(`/${cloudinary.cloudName}/`) || !decodedPath.includes(document.storageKey)) {
      throw new HttpError(400, 'Verification document asset URL does not match the signed upload');
    }
  }

  document.assetUrl = input.assetUrl;
  document.uploadStatus = MediaUploadStatus.UPLOADED;
  document.fileSizeBytes = input.bytes ?? document.fileSizeBytes;
  await document.save();

  return publicVerificationDocument(document);
}

export async function createVerificationDocumentPreviewAccess(
  actorId: Types.ObjectId,
  requestId: string,
  document: HydratedDocument<VerificationDocument>,
) {
  const expiresAt = Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS;
  const token = signPreviewToken(document.id, requestId, actorId.toString(), expiresAt);

  return {
    document: {
      id: document.id,
      documentType: document.documentType,
      encrypted: document.encrypted,
      originalFilename: document.originalFilename,
      mimeType: document.mimeType,
    },
    previewUrl: `${LOCAL_UPLOAD_BASE_URL}/api/admin/verifications/${requestId}/documents/${document.id}/preview?token=${encodeURIComponent(token)}`,
    expiresAt: new Date(expiresAt * 1000),
  };
}

export async function resolveVerificationDocumentPreview(
  actorId: Types.ObjectId,
  actorRole: string,
  requestId: string,
  documentId: string,
  token: string,
) {
  if (
    actorRole !== UserRole.ADMIN &&
    actorRole !== UserRole.SUPER_ADMIN &&
    actorRole !== UserRole.MODERATOR
  ) {
    throw new HttpError(403, 'Admin access required');
  }

  if (!Types.ObjectId.isValid(documentId) || !Types.ObjectId.isValid(requestId)) {
    throw new HttpError(404, 'Verification document not found');
  }

  verifyPreviewToken(documentId, requestId, actorId.toString(), token);

  const document = await VerificationDocumentModel.findOne({
    _id: documentId,
    requestId,
    isDeleted: false,
    uploadStatus: MediaUploadStatus.UPLOADED,
  });

  if (!document) {
    throw new HttpError(404, 'Verification document not found');
  }

  if (document.uploadProvider === 'gcs') {
    return {
      mode: 'local' as const,
      filePath: path.join(process.cwd(), 'uploads', document.storageKey),
      mimeType: document.mimeType,
    };
  }

  return {
    mode: 'redirect' as const,
    assetUrl: document.assetUrl,
  };
}
