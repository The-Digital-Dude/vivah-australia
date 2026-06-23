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
import {
  isGcsConfigured,
  objectExists,
  publicUrl,
  signedReadUrl,
  signedUploadUrl,
} from '../storage/gcs.js';

const UPLOAD_TTL_SECONDS = 10 * 60;
const ACCESS_TTL_SECONDS = 5 * 60;
const LOCAL_UPLOAD_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
const LOCAL_STORAGE_ROUTE = '/api/mock-gcs-storage/';

function isProductionEnv() {
  return process.env.NODE_ENV === 'production';
}

// Real Google Cloud Storage when configured; otherwise a local on-disk mock for
// development. Verification documents are always private — never public-read.
function storageProvider(): 'gcs' | 'mock' {
  if (isGcsConfigured()) {
    return 'gcs';
  }
  if (isProductionEnv()) {
    throw new HttpError(500, 'Google Cloud Storage is required for uploads in production');
  }
  return 'mock';
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
    storedSecurely: document.storedSecurely,
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
  const provider = storageProvider();
  const document = await VerificationDocumentModel.create({
    userId,
    documentType: input.documentType,
    storageKey,
    assetUrl: provider === 'gcs' ? publicUrl(storageKey) : localAssetUrl(storageKey),
    uploadProvider: provider,
    uploadExpiresAt: expiresAt,
    uploadStatus: MediaUploadStatus.SIGNED,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    originalFilename: input.fileName,
  });

  const url =
    provider === 'gcs'
      ? await signedUploadUrl(storageKey, input.mimeType)
      : localAssetUrl(storageKey);

  return {
    document: publicVerificationDocument(document),
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

  let assetUrl: string;
  if (document.uploadProvider === 'gcs') {
    // Verification documents stay private — no public ACL is applied.
    if (!(await objectExists(document.storageKey))) {
      throw new HttpError(400, 'Verification document upload was not found in storage');
    }
    assetUrl = publicUrl(document.storageKey);
  } else {
    if (isProductionEnv()) {
      throw new HttpError(400, 'Mock storage uploads are not allowed in production');
    }
    if (input.assetUrl.split('?')[0] !== localAssetUrl(document.storageKey)) {
      throw new HttpError(400, 'Verification document asset URL does not match the signed upload target');
    }
    assetUrl = localAssetUrl(document.storageKey);
  }

  document.assetUrl = assetUrl;
  document.uploadStatus = MediaUploadStatus.UPLOADED;
  document.fileSizeBytes = input.bytes ?? document.fileSizeBytes;
  await document.save();

  return publicVerificationDocument(document);
}

export function createVerificationDocumentPreviewAccess(
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
      storedSecurely: document.storedSecurely,
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

  if (document.uploadProvider === 'mock') {
    return {
      mode: 'local' as const,
      filePath: path.join(process.cwd(), 'uploads', document.storageKey),
      mimeType: document.mimeType,
    };
  }

  // Real GCS: deliver the private object via a short-lived signed read URL.
  const signedUrl = await signedReadUrl(document.storageKey);
  return {
    mode: 'redirect' as const,
    assetUrl: signedUrl,
  };
}
