import {
  AccountStatus,
  CommunityPostStatus,
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
import { listFraudEvents, reviewFraudEvent } from '../common/fraud.service.js';
import { createNotification } from '../notifications/notifications.service.js';
import {
  AdminNoteModel,
  AuditLogModel,
  CommunityCommentModel,
  CommunityPostModel,
  InterestModel,
  MessageModel,
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

type DateRangeInput = { from?: Date; to?: Date };

function dateRange(input: DateRangeInput = {}) {
  return {
    from: input.from ?? monthStart(),
    to: input.to ?? new Date(),
  };
}

function createdAtMatch(input: DateRangeInput = {}) {
  const range = dateRange(input);
  return { createdAt: { $gte: range.from, $lte: range.to } };
}

function verificationPriority(request: {
  type: string;
  status: string;
  submittedAt?: Date;
  createdAt: Date;
}) {
  const typeRank: Record<string, number> = {
    POLICE_CLEARANCE: 5,
    FACIAL: 5,
    IDENTITY: 4,
    VISA: 4,
    EMPLOYMENT: 3,
    ADDRESS: 3,
    MOBILE: 2,
    EMAIL: 1,
  };
  const ageMs = Date.now() - new Date(request.submittedAt ?? request.createdAt).getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000)));
  const score =
    (request.status === VerificationStatus.PENDING ? 20 : 0) +
    (typeRank[request.type] ?? 1) * 10 +
    Math.min(ageDays, 14);
  return {
    ageDays,
    label: score >= 65 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'NORMAL',
    score,
  };
}

function profileReviewSnapshot(profile: Awaited<ReturnType<typeof ProfileModel.findOne>>) {
  if (!profile) return null;
  return {
    personal: profile.personal,
    religion: profile.religion,
    location: profile.location,
    education: profile.education,
    employment: profile.employment,
    family: profile.family,
    lifestyle: profile.lifestyle,
    about: profile.about,
    partnerPreference: profile.partnerPreference,
    visibility: profile.visibility,
    completionPercentage: profile.completionPercentage,
    updatedAt: profile.updatedAt,
  };
}

function csvEscape(value: unknown) {
  let stringValue = '';
  if (typeof value === 'string') stringValue = value;
  else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    stringValue = value.toString();
  } else if (value !== null && value !== undefined) {
    stringValue = JSON.stringify(value) ?? '';
  }
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function aggregateRowsToCsv(name: string, rows: Array<Record<string, unknown>>) {
  return rows.map((row) =>
    [name, row._id ?? 'UNKNOWN', row.count ?? 0, row.totalCents ?? ''].map(csvEscape).join(','),
  );
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
      .sort({ createdAt: 1 })
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
      verifications: recentVerifications
        .map((request) => ({ ...request, priority: verificationPriority(request) }))
        .sort((a, b) => b.priority.score - a.priority.score),
      reports: recentReports,
    },
  };
}

export async function getAnalyticsSummary(input: DateRangeInput = {}) {
  const range = dateRange(input);
  const rangeMatch = createdAtMatch(range);
  const [
    usersByRole,
    usersByStatus,
    profilesByStatus,
    reportsByStatus,
    paymentsByStatus,
    revenue,
    subscriptionsByStatus,
    verificationByStatus,
    matchInterestStats,
    messagingActivity,
    communityActivity,
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
      { $match: { isDeleted: false, ...rangeMatch } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    PaymentModel.aggregate<{ _id: string; count: number; totalCents: number }>([
      { $match: { isDeleted: false, ...rangeMatch } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalCents: { $sum: '$amountCents' } } },
    ]),
    PaymentModel.aggregate<{ totalCents: number }>([
      { $match: { status: 'SUCCEEDED', isDeleted: false, ...rangeMatch } },
      { $group: { _id: null, totalCents: { $sum: '$amountCents' } } },
    ]),
    SubscriptionModel.aggregate<{ _id: string; count: number }>([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    VerificationRequestModel.aggregate<{ _id: string; count: number }>([
      { $match: { isDeleted: false, ...rangeMatch } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    InterestModel.aggregate<{ _id: string; count: number }>([
      { $match: { isDeleted: false, ...rangeMatch } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    MessageModel.aggregate<{ _id: string; count: number }>([
      { $match: { isDeleted: false, ...rangeMatch } },
      {
        $group: {
          _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Promise.all([
      CommunityPostModel.countDocuments({ isDeleted: false, ...rangeMatch }),
      CommunityCommentModel.countDocuments({ isDeleted: false, ...rangeMatch }),
    ]).then(([posts, comments]) => [
      { _id: 'POSTS', count: posts },
      { _id: 'COMMENTS', count: comments },
    ]),
  ]);

  return {
    generatedAt: new Date(),
    range,
    monthlyRevenueCents: revenue[0]?.totalCents ?? 0,
    usersByRole,
    usersByStatus,
    profilesByStatus,
    reportsByStatus,
    paymentsByStatus,
    subscriptionsByStatus,
    verificationByStatus,
    matchInterestStats,
    messagingActivity,
    communityActivity,
  };
}

export async function getAnalyticsCsv(input: DateRangeInput = {}) {
  const summary = await getAnalyticsSummary(input);
  return [
    ['section', 'key', 'count', 'totalCents'].join(','),
    ...aggregateRowsToCsv('usersByRole', summary.usersByRole),
    ...aggregateRowsToCsv('usersByStatus', summary.usersByStatus),
    ...aggregateRowsToCsv('profilesByStatus', summary.profilesByStatus),
    ...aggregateRowsToCsv('verificationByStatus', summary.verificationByStatus),
    ...aggregateRowsToCsv('reportsByStatus', summary.reportsByStatus),
    ...aggregateRowsToCsv('paymentsByStatus', summary.paymentsByStatus),
    ...aggregateRowsToCsv('subscriptionsByStatus', summary.subscriptionsByStatus),
    ...aggregateRowsToCsv('matchInterestStats', summary.matchInterestStats),
    ...aggregateRowsToCsv('messagingActivity', summary.messagingActivity),
    ...aggregateRowsToCsv('communityActivity', summary.communityActivity),
  ].join('\n');
}

export async function getFraudEvents() {
  return { events: await listFraudEvents() };
}

export async function updateFraudEventStatus(
  adminId: Types.ObjectId,
  eventId: string,
  status: 'REVIEWED' | 'DISMISSED',
) {
  const event = await reviewFraudEvent(eventId, status, adminId);
  if (!event) {
    throw new HttpError(404, 'Fraud event not found');
  }
  await logAudit({
    actorId: adminId,
    action: 'FRAUD_EVENT_REVIEWED',
    targetType: 'FraudEvent',
    targetId: event._id,
    metadata: { status, rule: event.rule },
  });
  return event;
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
  const previousSnapshot = profile.moderation.lastReviewSnapshot?.current ?? null;
  const currentSnapshot = profileReviewSnapshot(profile);
  profile.set('moderation.approvalStatus', status);
  profile.set('moderation.reviewedBy', actorId);
  profile.set('moderation.reviewedAt', new Date());
  profile.set('moderation.rejectionReason', input.reason);
  profile.set('moderation.internalNote', input.internalNote);
  profile.set('moderation.lastReviewSnapshot', {
    previous: previousSnapshot,
    current: currentSnapshot,
  });
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
  const requests = await VerificationRequestModel.find({ status, isDeleted: false })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();
  return requests
    .map((request) => ({ ...request, priority: verificationPriority(request) }))
    .sort((a, b) => b.priority.score - a.priority.score);
}

export async function getVerificationRequestDetail(requestId: string, actorId?: Types.ObjectId) {
  const request = await VerificationRequestModel.findOne({
    _id: requestId,
    isDeleted: false,
  }).lean();
  if (!request) throw new HttpError(404, 'Verification request not found');
  const documents = await VerificationDocumentModel.find({
    requestId,
    isDeleted: false,
  })
    .select('_id documentType encrypted createdAt updatedAt')
    .lean();
  if (actorId) {
    await logAudit({
      actorId,
      action: 'VERIFICATION_DOCUMENT_LIST_VIEWED',
      targetType: 'VERIFICATION_REQUEST',
      targetId: request._id,
      targetUserId: request.userId,
      metadata: { documentCount: documents.length },
    });
  }
  return { request, documents };
}

export async function getVerificationDocumentPreview(
  actorId: Types.ObjectId,
  actorRole: string,
  requestId: string,
  documentId: string,
) {
  const request = await VerificationRequestModel.findOne({ _id: requestId, isDeleted: false });
  if (!request) throw new HttpError(404, 'Verification request not found');
  const document = await VerificationDocumentModel.findOne({
    _id: documentId,
    requestId: request._id,
    isDeleted: false,
  }).lean();
  if (!document) throw new HttpError(404, 'Verification document not found');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const previewToken = Buffer.from(
    JSON.stringify({ documentId, requestId, exp: expiresAt.toISOString() }),
  ).toString('base64url');
  await logAudit({
    actorId,
    actorRole,
    action: 'VERIFICATION_DOCUMENT_PREVIEWED',
    targetType: 'VERIFICATION_DOCUMENT',
    targetId: document._id,
    targetUserId: document.userId,
    metadata: { requestId, documentType: document.documentType, expiresAt },
  });
  return {
    document: {
      id: String(document._id),
      documentType: document.documentType,
      encrypted: document.encrypted,
    },
    previewUrl: `/api/admin/verifications/${requestId}/documents/${documentId}/preview?token=${previewToken}`,
    expiresAt,
  };
}

export async function recalculateVerificationBadges(actorId: Types.ObjectId, actorRole: string) {
  const profiles = await ProfileModel.find({ isDeleted: false }).select('_id userId verification');
  let changed = 0;
  for (const profile of profiles) {
    const nextLevel = calculateVerificationBadge(profile);
    if (profile.verification.level !== nextLevel) {
      profile.verification.level = nextLevel;
      await profile.save();
      changed += 1;
    }
  }
  await logAudit({
    actorId,
    actorRole,
    action: 'VERIFICATION_BADGES_RECALCULATED',
    targetType: 'PROFILE',
    metadata: { scanned: profiles.length, changed },
  });
  return { scanned: profiles.length, changed };
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

  const profile = await ProfileModel.findOne({ userId: request.userId, isDeleted: false });
  const path = verificationPath(request.type);
  if (input.status === VerificationStatus.APPROVED) {
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
  } else if (profile && path) {
    profile.set(path, false);
    profile.verification.level = calculateVerificationBadge(profile);
    await profile.save();
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

export async function performModerationAction(
  actorId: Types.ObjectId,
  actorRole: string,
  reportId: string,
  action: 'WARN' | 'SUSPEND' | 'BAN' | 'REMOVE_CONTENT' | 'DISMISS',
) {
  const report = await ReportModel.findOne({ _id: reportId, isDeleted: false });
  if (!report) throw new HttpError(404, 'Report not found');

  if (action === 'WARN') {
    const targetUserId = report.reportedUserId;
    if (!targetUserId) throw new HttpError(400, 'Report has no user to warn');
    await createNotification({
      userId: targetUserId,
      type: 'MODERATION_WARNING',
      title: 'Moderation warning',
      body: 'A moderator reviewed a report linked to your account. Please follow community guidelines.',
      emailSubject: 'Vivah Australia moderation warning',
      emailBody:
        'A moderator reviewed a report linked to your account. Please follow community guidelines.',
    });
    report.status = ReportStatus.RESOLVED;
  }

  if (action === 'SUSPEND' || action === 'BAN') {
    const targetUserId = report.reportedUserId;
    if (!targetUserId) throw new HttpError(400, 'Report has no user to restrict');
    await updateUserStatus(actorId, actorRole, String(targetUserId), {
      status: action === 'BAN' ? AccountStatus.BANNED : AccountStatus.SUSPENDED,
    });
    report.status = ReportStatus.RESOLVED;
  }

  if (action === 'REMOVE_CONTENT') {
    if (!report.targetId) throw new HttpError(400, 'Report has no content target');
    if (['COMMUNITY_POST', 'POST'].includes(report.targetType)) {
      const update = await CommunityPostModel.updateOne(
        { _id: report.targetId, isDeleted: false },
        { $set: { status: CommunityPostStatus.REMOVED, updatedBy: actorId } },
      );
      if (update.matchedCount === 0) throw new HttpError(404, 'Reported content not found');
    } else if (['COMMUNITY_COMMENT', 'COMMENT'].includes(report.targetType)) {
      const update = await CommunityCommentModel.updateOne(
        { _id: report.targetId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: actorId } },
      );
      if (update.matchedCount === 0) throw new HttpError(404, 'Reported content not found');
    } else {
      throw new HttpError(400, 'Remove content is only available for community posts/comments');
    }
    report.status = ReportStatus.RESOLVED;
  }

  if (action === 'DISMISS') {
    report.status = ReportStatus.DISMISSED;
  }

  await report.save();
  await logAudit({
    actorId,
    actorRole,
    action: `MODERATION_${action}`,
    targetType: 'REPORT',
    targetId: report._id,
    ...(report.reportedUserId ? { targetUserId: report.reportedUserId } : {}),
    metadata: { targetType: report.targetType, targetId: report.targetId },
  });
  return report;
}
