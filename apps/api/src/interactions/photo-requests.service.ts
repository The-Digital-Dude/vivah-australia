import { Types } from 'mongoose';
import { HttpError } from '../auth/auth-errors.js';
import {
  BlockModel,
  InterestModel,
  PhotoRequestModel,
  ProfileApprovalStatus,
  ProfileMediaModel,
  ProfileModel,
  UserModel,
} from '../models/index.js';
import {
  InterestStatus,
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
  UserRole,
  VerificationStatus,
} from '@vivah/shared';
import { createNotification } from '../notifications/notifications.service.js';

// Access grant lasts 30 days from acceptance
const ACCESS_GRANT_DAYS = 30;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function assertNoBlock(requesterId: Types.ObjectId, ownerId: Types.ObjectId) {
  const block = await BlockModel.findOne({
    isDeleted: false,
    $or: [
      { blockerId: requesterId, blockedId: ownerId },
      { blockerId: ownerId, blockedId: requesterId },
    ],
  }).lean();

  if (block) {
    throw new HttpError(403, 'Cannot send request to this profile');
  }
}

// ── Send / Re-send a request ─────────────────────────────────────────────────

export async function sendPhotoRequest(
  requesterId: Types.ObjectId,
  ownerProfileId: string,
  message?: string,
) {
  if (!Types.ObjectId.isValid(ownerProfileId)) {
    throw new HttpError(404, 'Profile not found');
  }

  const ownerProfile = await ProfileModel.findOne({
    _id: ownerProfileId,
    isDeleted: false,
    'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
  }).lean();

  if (!ownerProfile) {
    throw new HttpError(404, 'Profile not found');
  }

  const ownerId = ownerProfile.userId;

  if (ownerId.equals(requesterId)) {
    throw new HttpError(400, 'Cannot request access to your own photos');
  }

  await assertNoBlock(requesterId, ownerId);

  // Check if already ACCEPTED and still within access window
  const existing = await PhotoRequestModel.findOne({
    requesterId,
    ownerId,
    isDeleted: false,
  }).lean();

  if (
    existing?.status === 'ACCEPTED' &&
    existing.accessGrantedUntil &&
    existing.accessGrantedUntil > new Date()
  ) {
    throw new HttpError(409, 'You already have active photo access for this profile');
  }

  // Upsert — if REJECTED/WITHDRAWN we allow re-sending (creates fresh PENDING)
  const photoRequest = await PhotoRequestModel.findOneAndUpdate(
    { requesterId, ownerId },
    {
      $set: {
        requesterId,
        ownerId,
        ownerProfileId: ownerProfile._id,
        status: 'PENDING',
        message: message?.trim() ?? undefined,
        respondedAt: undefined,
        accessGrantedUntil: undefined,
        isDeleted: false,
      },
      $unset: { deletedAt: '', deletedBy: '', respondedAt: '', accessGrantedUntil: '' },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  // Notify the owner
  const requesterProfile = await ProfileModel.findOne({
    userId: requesterId,
    isDeleted: false,
  }).lean();
  const requesterName = requesterProfile?.personal?.firstName ?? 'A member';

  await createNotification({
    userId: ownerId,
    type: 'PHOTO_REQUEST_RECEIVED',
    title: 'New photo access request',
    body: `${requesterName} has requested to view your private photos.`,
    data: { photoRequestId: String(photoRequest?._id), requesterId: String(requesterId) },
    pushBody: `${requesterName} wants to see your private photos.`,
  });

  return photoRequest;
}

// ── Owner responds (accept / reject) ─────────────────────────────────────────

export async function respondToPhotoRequest(
  ownerId: Types.ObjectId,
  requestId: string,
  action: 'ACCEPT' | 'REJECT',
) {
  if (!Types.ObjectId.isValid(requestId)) {
    throw new HttpError(404, 'Request not found');
  }

  const photoRequest = await PhotoRequestModel.findOne({
    _id: requestId,
    ownerId,
    status: 'PENDING',
    isDeleted: false,
  });

  if (!photoRequest) {
    throw new HttpError(404, 'Pending photo request not found');
  }

  photoRequest.status = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
  photoRequest.respondedAt = new Date();

  if (action === 'ACCEPT') {
    const grantUntil = new Date();
    grantUntil.setDate(grantUntil.getDate() + ACCESS_GRANT_DAYS);
    photoRequest.accessGrantedUntil = grantUntil;
  }

  await photoRequest.save();

  // Notify requester
  const ownerProfile = await ProfileModel.findOne({ userId: ownerId, isDeleted: false }).lean();
  const ownerName = ownerProfile?.personal?.firstName ?? 'The member';

  const title =
    action === 'ACCEPT' ? 'Photo access request accepted!' : 'Photo access request declined';
  const body =
    action === 'ACCEPT'
      ? `${ownerName} has accepted your request. You can now view their private photos for ${ACCESS_GRANT_DAYS} days.`
      : `${ownerName} has declined your photo access request.`;

  await createNotification({
    userId: photoRequest.requesterId,
    type: action === 'ACCEPT' ? 'PHOTO_REQUEST_ACCEPTED' : 'PHOTO_REQUEST_REJECTED',
    title,
    body,
    data: {
      photoRequestId: requestId,
      ownerProfileId: String(ownerProfile?._id ?? photoRequest.ownerProfileId),
    },
    pushBody: body,
  });

  return photoRequest;
}

// ── Requester withdraws a pending request ─────────────────────────────────────

export async function withdrawPhotoRequest(requesterId: Types.ObjectId, requestId: string) {
  if (!Types.ObjectId.isValid(requestId)) {
    throw new HttpError(404, 'Request not found');
  }

  const photoRequest = await PhotoRequestModel.findOne({
    _id: requestId,
    requesterId,
    status: 'PENDING',
    isDeleted: false,
  });

  if (!photoRequest) {
    throw new HttpError(404, 'Pending photo request not found');
  }

  photoRequest.status = 'WITHDRAWN';
  await photoRequest.save();

  return photoRequest;
}

// ── Check if requester has active access to an owner's private gallery ────────

export async function hasPhotoAccess(
  requesterId: Types.ObjectId,
  ownerId: Types.ObjectId,
): Promise<boolean> {
  if (requesterId.equals(ownerId)) {
    return true;
  }

  // Check if requester is an admin/moderator
  const requester = await UserModel.findById(requesterId).lean();
  if (
    requester?.role === UserRole.ADMIN ||
    requester?.role === UserRole.SUPER_ADMIN ||
    requester?.role === UserRole.MODERATOR
  ) {
    return true;
  }

  const now = new Date();
  const photoRequest = await PhotoRequestModel.findOne({
    requesterId,
    ownerId,
    status: 'ACCEPTED',
    accessGrantedUntil: { $gt: now },
    isDeleted: false,
  }).lean();

  if (photoRequest) {
    return true;
  }

  // Fallback: Check if there is an accepted interest between the two users
  const interest = await InterestModel.findOne({
    status: InterestStatus.ACCEPTED,
    isDeleted: false,
    $or: [
      { senderId: requesterId, receiverId: ownerId },
      { senderId: ownerId, receiverId: requesterId },
    ],
  }).lean();

  return !!interest;
}

// ── Get the request status between two users ──────────────────────────────────

export async function getPhotoRequestStatus(
  requesterId: Types.ObjectId,
  ownerId: Types.ObjectId,
) {
  const hasAccess = await hasPhotoAccess(requesterId, ownerId);

  const photoRequest = await PhotoRequestModel.findOne({
    requesterId,
    ownerId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!photoRequest) {
    return { status: 'NONE' as const, hasAccess, requestId: null, accessGrantedUntil: null };
  }

  return {
    status: photoRequest.status,
    hasAccess,
    requestId: String(photoRequest._id),
    accessGrantedUntil: photoRequest.accessGrantedUntil ?? null,
  };
}

// ── Fetch private gallery photos (only if access is granted) ──────────────────

export async function getPrivateGalleryIfGranted(
  requesterId: Types.ObjectId,
  ownerProfileId: string,
) {
  if (!Types.ObjectId.isValid(ownerProfileId)) {
    throw new HttpError(404, 'Profile not found');
  }

  const ownerProfile = await ProfileModel.findOne({
    _id: ownerProfileId,
    isDeleted: false,
    'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
  }).lean();

  if (!ownerProfile) {
    throw new HttpError(404, 'Profile not found');
  }

  const access = await hasPhotoAccess(requesterId, ownerProfile.userId);
  if (!access) {
    throw new HttpError(403, 'Photo access not granted');
  }

  const media = await ProfileMediaModel.find({
    profileId: ownerProfile._id,
    category: MediaCategory.PRIVATE_GALLERY,
    uploadStatus: MediaUploadStatus.UPLOADED,
    approvalStatus: VerificationStatus.APPROVED,
    visibility: MediaVisibility.PRIVATE,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  return media.map((m) => ({
    id: String(m._id),
    assetUrl: m.assetUrl,
    mediaType: m.mediaType,
    category: m.category,
    isPrimary: m.isPrimary,
    createdAt: m.createdAt,
  }));
}

// ── List requests for the owner (incoming) ────────────────────────────────────

export async function listIncomingPhotoRequests(ownerId: Types.ObjectId) {
  const requests = await PhotoRequestModel.find({
    ownerId,
    isDeleted: false,
    status: { $in: ['PENDING', 'ACCEPTED'] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const requesterIds = requests.map((r) => r.requesterId);
  const profiles = await ProfileModel.find({
    userId: { $in: requesterIds },
    isDeleted: false,
  }).lean();

  const profileByUserId = new Map(profiles.map((p) => [String(p.userId), p]));
  const now = new Date();

  return requests.map((req) => {
    const profile = profileByUserId.get(String(req.requesterId));
    const isActive =
      req.status === 'ACCEPTED' && req.accessGrantedUntil && req.accessGrantedUntil > now;

    return {
      id: String(req._id),
      status: req.status,
      isActive: !!isActive,
      accessGrantedUntil: req.accessGrantedUntil ?? null,
      message: req.message ?? null,
      createdAt: req.createdAt,
      respondedAt: req.respondedAt ?? null,
      requester: profile
        ? {
            id: String(profile._id),
            displayId: profile.displayId,
            firstName: profile.personal?.firstName,
            age: profile.personal?.age,
            city: profile.location?.city,
            occupation: profile.employment?.occupation,
            verificationLevel: profile.verification?.level ?? 'NONE',
          }
        : null,
    };
  });
}

// ── List requests sent by the requester (outgoing) ────────────────────────────

export async function listOutgoingPhotoRequests(requesterId: Types.ObjectId) {
  const requests = await PhotoRequestModel.find({
    requesterId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  const ownerIds = requests.map((r) => r.ownerId);
  const profiles = await ProfileModel.find({
    userId: { $in: ownerIds },
    isDeleted: false,
  }).lean();

  const profileByUserId = new Map(profiles.map((p) => [String(p.userId), p]));
  const now = new Date();

  return requests.map((req) => {
    const profile = profileByUserId.get(String(req.ownerId));
    const isActive =
      req.status === 'ACCEPTED' && req.accessGrantedUntil && req.accessGrantedUntil > now;

    return {
      id: String(req._id),
      status: req.status,
      isActive: !!isActive,
      accessGrantedUntil: req.accessGrantedUntil ?? null,
      createdAt: req.createdAt,
      respondedAt: req.respondedAt ?? null,
      owner: profile
        ? {
            id: String(profile._id),
            displayId: profile.displayId,
            firstName: profile.personal?.firstName,
            age: profile.personal?.age,
            city: profile.location?.city,
            verificationLevel: profile.verification?.level ?? 'NONE',
          }
        : null,
    };
  });
}
