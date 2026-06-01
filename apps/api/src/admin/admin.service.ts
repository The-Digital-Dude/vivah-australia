import {
  AccountStatus,
  ReportStatus,
  SubscriptionStatus,
  VerificationLevel,
  VerificationStatus,
  type VerificationStatus as VerificationStatusType,
  type ProfileModerationQueryInput,
  type AdminUserNoteInput,
  type AdminUserQueryInput,
  type AdminUserRoleUpdateInput,
  type AdminUserStatusUpdateInput,
  type AdminUserUpdateInput,
  type ProfileModerationReviewInput,
  type VerificationRequestCreateInput,
  type VerificationReviewInput,
} from '@vivah/shared';
import type { Types } from 'mongoose';
import { HttpError } from '../auth/auth-errors.js';
import { logActivity, logAudit } from '../common/audit.service.js';
import { createNotification } from '../notifications/notifications.service.js';
import {
  AdminNoteModel,
  PaymentModel,
  ProfileApprovalStatus,
  ProfileModel,
  ReportModel,
  SubscriptionModel,
  UserModel,
  VerificationDocumentModel,
  VerificationRequestModel,
} from '../models/index.js';

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function publicUser(user: Awaited<ReturnType<typeof UserModel.findOne>>) {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    mobileVerified: user.mobileVerified,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function publicProfileSummary(profile: Awaited<ReturnType<typeof ProfileModel.findOne>>) {
  if (!profile) return null;
  return {
    id: profile.id,
    displayId: profile.displayId,
    firstName: profile.personal.firstName,
    lastName: profile.personal.lastName,
    verificationLevel: profile.verification.level,
    approvalStatus: profile.moderation.approvalStatus,
  };
}

export async function getDashboardSummary() {
  const [
    totalUsers,
    activeUsers,
    pendingProfiles,
    pendingVerifications,
    openReports,
    activeSubscriptions,
    monthlyRevenueResult,
    recentUsers,
    recentReports,
  ] = await Promise.all([
    UserModel.countDocuments({ isDeleted: false }),
    UserModel.countDocuments({ status: AccountStatus.ACTIVE, isDeleted: false }),
    ProfileModel.countDocuments({
      'moderation.approvalStatus': ProfileApprovalStatus.PENDING,
      isDeleted: false,
    }),
    VerificationRequestModel.countDocuments({
      status: VerificationStatus.PENDING,
      isDeleted: false,
    }),
    ReportModel.countDocuments({ status: ReportStatus.OPEN, isDeleted: false }),
    SubscriptionModel.countDocuments({
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      isDeleted: false,
    }),
    PaymentModel.aggregate<{ total: number }>([
      { $match: { status: 'SUCCEEDED', createdAt: { $gte: monthStart() }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amountCents' } } },
    ]),
    UserModel.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(6),
    ReportModel.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  return {
    totalUsers,
    activeUsers,
    pendingProfiles,
    pendingVerifications,
    openReports,
    activeSubscriptions,
    monthlyRevenue: monthlyRevenueResult[0]?.total ?? 0,
    recentUsers: recentUsers.map((user) => publicUser(user)),
    recentReports,
  };
}

export async function listUsers(input: AdminUserQueryInput) {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (input.role) filter.role = input.role;
  if (input.status) filter.status = input.status;
  if (input.q) {
    const matchingProfiles = await ProfileModel.find({
      isDeleted: false,
      $or: [
        { displayId: { $regex: input.q, $options: 'i' } },
        { 'personal.firstName': { $regex: input.q, $options: 'i' } },
        { 'personal.lastName': { $regex: input.q, $options: 'i' } },
      ],
    }).select('userId');
    filter.$or = [
      { email: { $regex: input.q, $options: 'i' } },
      { _id: { $in: matchingProfiles.map((profile) => profile.userId) } },
    ];
  }
  const skip = (input.page - 1) * input.pageSize;
  const [users, total] = await Promise.all([
    UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.pageSize),
    UserModel.countDocuments(filter),
  ]);
  const profiles = await ProfileModel.find({
    userId: { $in: users.map((user) => user._id) },
    isDeleted: false,
  });
  const profileByUser = new Map(profiles.map((profile) => [String(profile.userId), profile]));
  return {
    users: users.map((user) => ({
      ...publicUser(user),
      profile: publicProfileSummary(profileByUser.get(String(user._id)) ?? null),
    })),
    pagination: { page: input.page, pageSize: input.pageSize, total },
  };
}

export async function getUserDetail(targetUserId: string) {
  const user = await UserModel.findOne({ _id: targetUserId, isDeleted: false });
  if (!user) throw new HttpError(404, 'User not found');
  const [profile, notes] = await Promise.all([
    ProfileModel.findOne({ userId: user._id, isDeleted: false }),
    AdminNoteModel.find({ userId: user._id, isDeleted: false }).sort({ createdAt: -1 }).limit(25),
  ]);
  return {
    user: publicUser(user),
    profile: publicProfileSummary(profile),
    notes: notes.map((note) => ({
      id: note.id,
      authorId: String(note.authorId),
      note: note.note,
      createdAt: note.createdAt,
    })),
  };
}

export async function updateUser(
  actorId: Types.ObjectId,
  targetUserId: string,
  input: AdminUserUpdateInput,
) {
  const user = await UserModel.findOne({ _id: targetUserId, isDeleted: false });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  user.set(input);
  await user.save();
  await logAudit({
    actorId,
    action: 'ADMIN_USER_UPDATED',
    targetType: 'USER',
    targetId: user._id,
    metadata: input,
  });
  return publicUser(user);
}

export async function updateUserStatus(
  actorId: Types.ObjectId,
  targetUserId: string,
  input: AdminUserStatusUpdateInput,
) {
  return updateUser(actorId, targetUserId, { status: input.status });
}

export async function updateUserRole(
  actorId: Types.ObjectId,
  targetUserId: string,
  input: AdminUserRoleUpdateInput,
) {
  return updateUser(actorId, targetUserId, { role: input.role });
}

export async function addUserNote(
  actorId: Types.ObjectId,
  targetUserId: string,
  input: AdminUserNoteInput,
) {
  const user = await UserModel.findOne({ _id: targetUserId, isDeleted: false });
  if (!user) throw new HttpError(404, 'User not found');
  const note = await AdminNoteModel.create({
    userId: user._id,
    authorId: actorId,
    note: input.note,
  });
  await logAudit({
    actorId,
    action: 'ADMIN_USER_NOTE_ADDED',
    targetType: 'USER',
    targetId: user._id,
  });
  return {
    id: note.id,
    note: note.note,
    authorId: String(note.authorId),
    createdAt: note.createdAt,
  };
}

export async function listProfilesForModeration(status: ProfileModerationQueryInput['status']) {
  return ProfileModel.find({ 'moderation.approvalStatus': status, isDeleted: false })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();
}

export async function reviewProfile(
  actorId: Types.ObjectId,
  profileId: string,
  input: ProfileModerationReviewInput,
) {
  const profile = await ProfileModel.findOne({ _id: profileId, isDeleted: false });
  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }
  const status =
    input.action === 'APPROVE'
      ? ProfileApprovalStatus.APPROVED
      : input.action === 'REJECT'
        ? ProfileApprovalStatus.REJECTED
        : ProfileApprovalStatus.NEEDS_CHANGES;
  profile.set('moderation.approvalStatus', status);
  profile.set('moderation.reviewedBy', actorId);
  profile.set('moderation.reviewedAt', new Date());
  profile.set('moderation.rejectionReason', input.reason);
  await profile.save();
  await createNotification({
    userId: profile.userId,
    type: 'PROFILE_REVIEWED',
    title: `Profile ${status.toLowerCase().replace('_', ' ')}`,
    emailSubject: 'Your Vivah Australia profile was reviewed',
    emailBody: `Your profile review status is now ${status}.`,
    ...(input.reason ? { body: input.reason } : {}),
  });
  await logAudit({
    actorId,
    action: 'PROFILE_REVIEWED',
    targetType: 'PROFILE',
    targetId: profile._id,
    metadata: { status },
  });
  return profile;
}

function applyVerificationBadge(profile: Awaited<ReturnType<typeof ProfileModel.findOne>>) {
  if (!profile) return;
  const flags = profile.verification;
  const count = [
    flags.emailVerified,
    flags.mobileVerified,
    flags.identityVerified,
    flags.addressVerified,
    flags.employmentVerified,
    flags.visaVerified,
    flags.policeClearanceVerified,
    flags.facialVerified,
  ].filter(Boolean).length;
  profile.verification.level =
    count >= 6
      ? VerificationLevel.FULLY_VERIFIED
      : count >= 4
        ? VerificationLevel.PLATINUM
        : count >= 3
          ? VerificationLevel.GOLD
          : count >= 2
            ? VerificationLevel.SILVER
            : count >= 1
              ? VerificationLevel.BASIC
              : VerificationLevel.NONE;
}

function verificationPath(type: string) {
  const map: Record<string, string> = {
    IDENTITY: 'verification.identityVerified',
    ADDRESS: 'verification.addressVerified',
    EMPLOYMENT: 'verification.employmentVerified',
    VISA: 'verification.visaVerified',
    POLICE_CLEARANCE: 'verification.policeClearanceVerified',
    FACIAL: 'verification.facialVerified',
  };
  return map[type];
}

export async function createVerificationRequest(
  userId: Types.ObjectId,
  input: VerificationRequestCreateInput,
) {
  const profile = await ProfileModel.findOne({ userId, isDeleted: false });
  const request = await VerificationRequestModel.create({
    userId,
    ...(profile ? { profileId: profile._id } : {}),
    type: input.type,
    status: VerificationStatus.PENDING,
  });
  if (input.documentType && input.storageKey) {
    await VerificationDocumentModel.create({
      requestId: request._id,
      userId,
      documentType: input.documentType,
      storageKey: input.storageKey,
      encrypted: true,
    });
  }
  await logActivity({
    actorId: userId,
    event: 'VERIFICATION_REQUEST_CREATED',
    metadata: { type: input.type },
  });
  return request;
}

export async function listOwnVerificationRequests(userId: Types.ObjectId) {
  return VerificationRequestModel.find({ userId, isDeleted: false }).sort({ createdAt: -1 }).lean();
}

export async function listVerificationRequests(
  status: VerificationStatusType = VerificationStatus.PENDING,
) {
  return VerificationRequestModel.find({ status, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
}

export async function reviewVerificationRequest(
  actorId: Types.ObjectId,
  requestId: string,
  input: VerificationReviewInput,
) {
  const request = await VerificationRequestModel.findOne({ _id: requestId, isDeleted: false });
  if (!request) {
    throw new HttpError(404, 'Verification request not found');
  }
  request.status = input.status;
  request.set('reviewReason', input.reason);
  request.reviewedBy = actorId;
  request.reviewedAt = new Date();
  await request.save();

  if (input.status === VerificationStatus.APPROVED) {
    const profile = await ProfileModel.findOne({ userId: request.userId, isDeleted: false });
    const path = verificationPath(request.type);
    if (profile && path) {
      profile.set(path, true);
      applyVerificationBadge(profile);
      await profile.save();
    }
  }

  await createNotification({
    userId: request.userId,
    type: 'VERIFICATION_REVIEWED',
    title: `Verification ${input.status.toLowerCase().replace('_', ' ')}`,
    emailSubject: 'Your verification request was reviewed',
    emailBody: `Your ${request.type.toLowerCase()} verification request is ${input.status}.`,
    ...(input.reason ? { body: input.reason } : {}),
  });
  await logAudit({
    actorId,
    action: 'VERIFICATION_REVIEWED',
    targetType: 'VERIFICATION_REQUEST',
    targetId: request._id,
    metadata: { status: input.status, type: request.type },
  });

  return request;
}
