import {
  AccountStatus,
  ReportStatus,
  SubscriptionStatus,
  UserRole,
  VerificationStatus,
  type VerificationStatus as VerificationStatusType,
  type AuditLogQueryInput,
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
  AuditLogModel,
  PaymentModel,
  ProfileMediaModel,
  ProfileApprovalStatus,
  ProfileModel,
  ReportModel,
  SubscriptionModel,
  UserModel,
  VerificationDocumentModel,
  VerificationRequestModel,
} from '../models/index.js';
import { calculateVerificationBadge } from '../verification/badge.js';

const roleRank: Record<string, number> = {
  [UserRole.USER]: 1,
  [UserRole.PREMIUM_USER]: 2,
  [UserRole.MODERATOR]: 3,
  [UserRole.ADMIN]: 4,
  [UserRole.SUPER_ADMIN]: 5,
};

const adminRoles = new Set<string>([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]);
const selfDestructiveStatuses = [
  AccountStatus.SUSPENDED,
  AccountStatus.BANNED,
  AccountStatus.DELETED,
] as const;

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

export async function getModerationDashboard() {
  const [
    pendingProfiles,
    pendingVerifications,
    openReports,
    assignedReports,
    pendingMedia,
    recentProfiles,
    recentVerifications,
    recentReports,
  ] = await Promise.all([
    ProfileModel.countDocuments({
      'moderation.approvalStatus': ProfileApprovalStatus.PENDING,
      isDeleted: false,
    }),
    VerificationRequestModel.countDocuments({
      status: VerificationStatus.PENDING,
      isDeleted: false,
    }),
    ReportModel.countDocuments({ status: ReportStatus.OPEN, isDeleted: false }),
    ReportModel.countDocuments({ status: ReportStatus.ASSIGNED, isDeleted: false }),
    ProfileMediaModel.countDocuments({
      approvalStatus: VerificationStatus.PENDING,
      isDeleted: false,
    }),
    ProfileModel.find({
      'moderation.approvalStatus': ProfileApprovalStatus.PENDING,
      isDeleted: false,
    })
      .sort({ updatedAt: -1 })
      .limit(8)
      .select('displayId personal.firstName personal.lastName moderation updatedAt')
      .lean(),
    VerificationRequestModel.find({ status: VerificationStatus.PENDING, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    ReportModel.find({
      status: { $in: [ReportStatus.OPEN, ReportStatus.ASSIGNED] },
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ]);

  return {
    counts: { pendingProfiles, pendingVerifications, openReports, assignedReports, pendingMedia },
    queues: {
      profiles: recentProfiles,
      verifications: recentVerifications,
      reports: recentReports,
    },
  };
}

export async function getAnalyticsSummary() {
  const since = monthStart();
  const [
    usersByRole,
    usersByStatus,
    profilesByStatus,
    reportsByStatus,
    paymentsByStatus,
    revenue,
    subscriptionsByStatus,
    verificationByStatus,
  ] = await Promise.all([
    UserModel.aggregate<{ _id: string; count: number }>([
      { $match: { isDeleted: false } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    UserModel.aggregate<{ _id: string; count: number }>([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ProfileModel.aggregate<{ _id: string; count: number }>([
      { $match: { isDeleted: false } },
      { $group: { _id: '$moderation.approvalStatus', count: { $sum: 1 } } },
    ]),
    ReportModel.aggregate<{ _id: string; count: number }>([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    PaymentModel.aggregate<{ _id: string; count: number; totalCents: number }>([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalCents: { $sum: '$amountCents' } } },
    ]),
    PaymentModel.aggregate<{ totalCents: number }>([
      { $match: { status: 'SUCCEEDED', isDeleted: false, createdAt: { $gte: since } } },
      { $group: { _id: null, totalCents: { $sum: '$amountCents' } } },
    ]),
    SubscriptionModel.aggregate<{ _id: string; count: number }>([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    VerificationRequestModel.aggregate<{ _id: string; count: number }>([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    generatedAt: new Date(),
    monthlyRevenueCents: revenue[0]?.totalCents ?? 0,
    usersByRole,
    usersByStatus,
    profilesByStatus,
    reportsByStatus,
    paymentsByStatus,
    subscriptionsByStatus,
    verificationByStatus,
  };
}

export async function listUsers(input: AdminUserQueryInput) {
  const filter: Record<string, unknown> = {
    isDeleted: input.status === AccountStatus.DELETED ? true : false,
  };
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
  if (input.verificationLevel) {
    const matchingProfiles = await ProfileModel.find({
      isDeleted: false,
      'verification.level': input.verificationLevel,
    }).select('userId');
    filter._id = { $in: matchingProfiles.map((profile) => profile.userId) };
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
  actorRole: string,
  targetUserId: string,
  input: AdminUserUpdateInput,
) {
  const user = await UserModel.findOne({ _id: targetUserId });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  if (
    String(actorId) === targetUserId &&
    input.status &&
    selfDestructiveStatuses.some((status) => status === input.status)
  ) {
    throw new HttpError(403, 'Admins cannot suspend, ban, or delete themselves');
  }
  enforceUserManagement(actorRole, user.role, input);

  if (input.status === AccountStatus.DELETED) {
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = actorId;
  }
  user.set(input);
  await user.save();
  await logAudit({
    actorId,
    actorRole,
    action: 'ADMIN_USER_UPDATED',
    targetType: 'USER',
    targetId: user._id,
    targetUserId: user._id,
    metadata: input,
  });
  return publicUser(user);
}

function enforceUserManagement(actorRole: string, targetRole: string, input: AdminUserUpdateInput) {
  const actorRank = roleRank[actorRole] ?? 0;
  const targetRank = roleRank[targetRole] ?? 0;
  if (actorRank <= targetRank && actorRole !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, 'Cannot modify a user with an equal or higher role');
  }
  if (input.role) {
    const touchesAdminRole = adminRoles.has(targetRole) || adminRoles.has(input.role);
    if (touchesAdminRole && actorRole !== UserRole.SUPER_ADMIN) {
      throw new HttpError(403, 'Only SUPER_ADMIN can change admin roles');
    }
    const nextRank = roleRank[input.role] ?? 0;
    if (actorRank <= nextRank && actorRole !== UserRole.SUPER_ADMIN) {
      throw new HttpError(403, 'Cannot assign an equal or higher role');
    }
  }
}

export async function updateUserStatus(
  actorId: Types.ObjectId,
  actorRole: string,
  targetUserId: string,
  input: AdminUserStatusUpdateInput,
) {
  if (
    String(actorId) === targetUserId &&
    selfDestructiveStatuses.some((status) => status === input.status)
  ) {
    throw new HttpError(403, 'Admins cannot suspend, ban, or delete themselves');
  }
  return updateUser(actorId, actorRole, targetUserId, { status: input.status });
}

export async function updateUserRole(
  actorId: Types.ObjectId,
  actorRole: string,
  targetUserId: string,
  input: AdminUserRoleUpdateInput,
) {
  return updateUser(actorId, actorRole, targetUserId, { role: input.role });
}

export async function addUserNote(
  actorId: Types.ObjectId,
  actorRole: string,
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
    actorRole,
    action: 'ADMIN_USER_NOTE_ADDED',
    targetType: 'USER',
    targetId: user._id,
    targetUserId: user._id,
  });
  return {
    id: note.id,
    note: note.note,
    authorId: String(note.authorId),
    createdAt: note.createdAt,
  };
}

export async function listProfilesForModeration(input: ProfileModerationQueryInput) {
  const sort =
    input.sort === 'NEWEST' ? ({ createdAt: -1 } as const) : ({ updatedAt: -1 } as const);
  return ProfileModel.find({ 'moderation.approvalStatus': input.status, isDeleted: false })
    .sort(sort)
    .limit(100)
    .lean();
}

export async function getProfileModerationDetail(profileId: string) {
  const profile = await ProfileModel.findOne({ _id: profileId, isDeleted: false }).lean();
  if (!profile) throw new HttpError(404, 'Profile not found');
  return profile;
}

export async function listAuditLogs(input: AuditLogQueryInput) {
  const filter: Record<string, unknown> = {};
  if (input.actor) filter.actorId = input.actor;
  if (input.action) filter.action = { $regex: input.action, $options: 'i' };
  if (input.entityType) filter.targetType = input.entityType;
  if (input.from || input.to) {
    filter.createdAt = {
      ...(input.from ? { $gte: input.from } : {}),
      ...(input.to ? { $lte: input.to } : {}),
    };
  }
  const skip = (input.page - 1) * input.pageSize;
  const [logs, total] = await Promise.all([
    AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.pageSize).lean(),
    AuditLogModel.countDocuments(filter),
  ]);
  return { logs, pagination: { page: input.page, pageSize: input.pageSize, total } };
}

export async function reviewProfile(
  actorId: Types.ObjectId,
  actorRole: string,
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
  profile.set('moderation.internalNote', input.internalNote);
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
    actorRole,
    action: 'PROFILE_REVIEWED',
    targetType: 'PROFILE',
    targetId: profile._id,
    metadata: { status },
  });
  return profile;
}

function verificationPath(type: string) {
  const map: Record<string, string> = {
    EMAIL: 'verification.emailVerified',
    MOBILE: 'verification.mobileVerified',
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
    documentUrls: input.documentUrls,
    submittedAt: new Date(),
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

export async function getOwnVerificationRequest(userId: Types.ObjectId, requestId: string) {
  const request = await VerificationRequestModel.findOne({
    _id: requestId,
    userId,
    isDeleted: false,
  }).lean();
  if (!request) throw new HttpError(404, 'Verification request not found');
  return request;
}

export async function listVerificationRequests(
  status: VerificationStatusType = VerificationStatus.PENDING,
) {
  return VerificationRequestModel.find({ status, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
}

export async function getVerificationRequestDetail(requestId: string) {
  const request = await VerificationRequestModel.findOne({
    _id: requestId,
    isDeleted: false,
  }).lean();
  if (!request) throw new HttpError(404, 'Verification request not found');
  const documents = await VerificationDocumentModel.find({
    requestId,
    isDeleted: false,
  }).lean();
  return { request, documents };
}

export async function reviewVerificationRequest(
  actorId: Types.ObjectId,
  actorRole: string,
  requestId: string,
  input: VerificationReviewInput,
) {
  const request = await VerificationRequestModel.findOne({ _id: requestId, isDeleted: false });
  if (!request) {
    throw new HttpError(404, 'Verification request not found');
  }
  request.status = input.status;
  request.set('reviewReason', input.reason);
  request.set('adminNote', input.adminNote);
  request.reviewedBy = actorId;
  request.reviewedAt = new Date();
  await request.save();

  if (input.status === VerificationStatus.APPROVED) {
    const profile = await ProfileModel.findOne({ userId: request.userId, isDeleted: false });
    const path = verificationPath(request.type);
    if (request.type === 'EMAIL') {
      await UserModel.updateOne({ _id: request.userId }, { $set: { emailVerified: true } });
    }
    if (request.type === 'MOBILE') {
      await UserModel.updateOne({ _id: request.userId }, { $set: { mobileVerified: true } });
    }
    if (profile && path) {
      profile.set(path, true);
      profile.verification.level = calculateVerificationBadge(profile);
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
    actorRole,
    action: 'VERIFICATION_REVIEWED',
    targetType: 'VERIFICATION_REQUEST',
    targetId: request._id,
    metadata: { status: input.status, type: request.type },
  });

  return request;
}
