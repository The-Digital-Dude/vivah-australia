import {
  AccountStatus,
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
  ProfileVisibility,
  VerificationStatus,
  type ProfileDraftInput,
} from '@vivah/shared';
import { Types } from 'mongoose';
import { recordHighVelocityProfileViews } from '../common/fraud.service.js';
import { logActivity, logAudit } from '../common/audit.service.js';
import { HttpError } from '../auth/auth-errors.js';
import { isPaidMember, cancelSubscription } from '../billing/billing.service.js';
import {
  BlockModel,
  AuthTokenModel,
  NotificationModel,
  ProfileApprovalStatus,
  ProfileMediaModel,
  ProfileModel,
  ProfileViewModel,
  UserModel,
  InterestModel,
  FavouriteModel,
  SavedSearchModel,
} from '../models/index.js';
import { createNotification } from '../notifications/notifications.service.js';
import type { ProfileDocument } from '../models/profile.model.js';

const COMPLETION_FIELDS = [
  'personal.firstName',
  'personal.lastName',
  'personal.gender',
  'personal.dateOfBirth',
  'personal.maritalStatus',
  'location.country',
  'location.city',
  'religion.religion',
  'religion.community',
  'education.highestQualification',
  'employment.occupation',
  'about.aboutMe',
  'about.partnerExpectations',
] as const;

const SENSITIVE_UPDATE_PREFIXES = [
  'personal.',
  'religion.',
  'location.',
  'education.',
  'employment.',
];

function getPathValue(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }

    return (value as Record<string, unknown>)[segment];
  }, source);
}

function hasMeaningfulValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && value !== '';
}

function flattenKeys(input: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(input).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      return flattenKeys(value as Record<string, unknown>, path);
    }

    return [path];
  });
}

export function calculateProfileCompletion(profile: ProfileDocument): number {
  const completed = COMPLETION_FIELDS.filter((field) =>
    hasMeaningfulValue(getPathValue(profile, field)),
  ).length;
  return Math.round((completed / COMPLETION_FIELDS.length) * 100);
}

export function calculateAge(dateOfBirth: Date, asOf = new Date()): number {
  let age = asOf.getFullYear() - dateOfBirth.getFullYear();
  const monthDelta = asOf.getMonth() - dateOfBirth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && asOf.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }

  return age;
}

export function assertAdultDateOfBirth(dateOfBirth?: Date): void {
  if (!dateOfBirth) {
    return;
  }

  if (calculateAge(dateOfBirth) < 18) {
    throw new HttpError(400, 'Profile owner must be at least 18 years old');
  }
}

export async function getOwnProfile(userId: Types.ObjectId) {
  const profile = await ProfileModel.findOne({ userId, isDeleted: false });

  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }

  return profile;
}

export async function updateOwnProfile(userId: Types.ObjectId, input: ProfileDraftInput) {
  assertAdultDateOfBirth(input.personal?.dateOfBirth);
  const profile = await getOwnProfile(userId);
  const flattenedKeys = flattenKeys(input);

  profile.set(input);

  if (input.personal?.dateOfBirth) {
    profile.set('personal.age', calculateAge(input.personal.dateOfBirth));
  }

  if (
    profile.moderation.approvalStatus === ProfileApprovalStatus.APPROVED &&
    flattenedKeys.some((key) => SENSITIVE_UPDATE_PREFIXES.some((prefix) => key.startsWith(prefix)))
  ) {
    profile.set('moderation.approvalStatus', ProfileApprovalStatus.PENDING);
    profile.set('moderation.reviewedBy', undefined);
    profile.set('moderation.reviewedAt', undefined);
    profile.set('moderation.rejectionReason', undefined);
  }

  profile.completionPercentage = calculateProfileCompletion(profile);
  await profile.save();
  return profile;
}

export async function submitOwnProfile(userId: Types.ObjectId) {
  const profile = await getOwnProfile(userId);
  const requiredMissing = COMPLETION_FIELDS.filter(
    (field) => !hasMeaningfulValue(getPathValue(profile, field)),
  );

  if (requiredMissing.length > 0) {
    throw new HttpError(400, `Profile is incomplete: ${requiredMissing.join(', ')}`);
  }

  profile.completionPercentage = calculateProfileCompletion(profile);
  profile.set('moderation.approvalStatus', ProfileApprovalStatus.PENDING);
  profile.set('moderation.reviewedBy', undefined);
  profile.set('moderation.reviewedAt', undefined);
  profile.set('moderation.rejectionReason', undefined);
  await profile.save();
  return profile;
}

export async function getVisibleProfile(profileId: string, viewerId?: Types.ObjectId) {
  const normalizedProfileId = profileId.trim();
  const lookup = Types.ObjectId.isValid(normalizedProfileId)
    ? { _id: normalizedProfileId }
    : {
        $or: [
          { slug: normalizedProfileId.toLowerCase() },
          { displayId: normalizedProfileId.toUpperCase() },
        ],
      };

  const profile = await ProfileModel.findOne({
    ...lookup,
    isDeleted: false,
    'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
    'visibility.status': { $ne: ProfileVisibility.HIDDEN },
  });

  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }

  if (viewerId) {
    const block = await BlockModel.findOne({
      isDeleted: false,
      $or: [
        { blockerId: viewerId, blockedId: profile.userId },
        { blockerId: profile.userId, blockedId: viewerId },
      ],
    });

    if (block) {
      throw new HttpError(403, 'Profile is not available');
    }
  }

  if (profile.visibility.status !== ProfileVisibility.PUBLIC && !viewerId) {
    throw new HttpError(401, 'Authentication required');
  }

  if (!viewerId || !profile.userId.equals(viewerId)) {
    profile.stats.profileViews += 1;
    await profile.save();
  }

  if (viewerId && !profile.userId.equals(viewerId)) {
    const viewedAt = new Date();
    await ProfileViewModel.findOneAndUpdate(
      { viewerId, profileId: profile._id },
      {
        $set: {
          viewerId,
          profileId: profile._id,
          profileUserId: profile.userId,
          viewedAt,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    await notifyPaidProfileView(viewerId, profile, viewedAt);
    const recentViewCount = await ProfileViewModel.countDocuments({
      viewerId,
      viewedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      isDeleted: false,
    });
    if (recentViewCount >= 20) {
      await recordHighVelocityProfileViews(viewerId, recentViewCount);
    }
  }

  const visibleProfile = applyPrivacy(profile, viewerId) as unknown as Record<string, unknown>;

  if (profile.visibility.showPhoto) {
    const [media, videoIntro] = await Promise.all([
      ProfileMediaModel.find({
        profileId: profile._id,
        uploadStatus: MediaUploadStatus.UPLOADED,
        approvalStatus: VerificationStatus.APPROVED,
        mediaType: 'PHOTO',
        category: { $in: [MediaCategory.PROFILE_PHOTO, MediaCategory.PUBLIC_GALLERY] },
        visibility: { $in: [MediaVisibility.PUBLIC, MediaVisibility.MATCHES_ONLY] },
        isDeleted: false,
      })
        .sort({ isPrimary: -1, createdAt: -1 })
        .lean(),
      ProfileMediaModel.findOne({
        profileId: profile._id,
        uploadStatus: MediaUploadStatus.UPLOADED,
        approvalStatus: VerificationStatus.APPROVED,
        mediaType: 'VIDEO',
        category: MediaCategory.VIDEO_INTRO,
        isDeleted: false,
      }).lean()
    ]);

    visibleProfile.photoUrl = media[0]?.assetUrl;
    visibleProfile.publicGallery = media.map((item) => ({
      id: String(item._id),
      assetUrl: item.assetUrl,
      isPrimary: item.isPrimary,
      category: item.category,
    }));
    visibleProfile.videoUrl = videoIntro?.assetUrl;
  } else {
    visibleProfile.photoUrl = undefined;
    visibleProfile.publicGallery = [];
    visibleProfile.videoUrl = undefined;
  }

  return visibleProfile;
}

export async function listRecentlyViewedProfiles(userId: Types.ObjectId) {
  const views = await ProfileViewModel.find({ viewerId: userId, isDeleted: false })
    .sort({ viewedAt: -1 })
    .limit(30)
    .lean();
  const profiles = await ProfileModel.find({
    _id: { $in: views.map((view) => view.profileId) },
    isDeleted: false,
    'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
  });
  const profileById = new Map(profiles.map((profile) => [String(profile._id), profile]));

  return views
    .map((view) => {
      const profile = profileById.get(String(view.profileId));
      return profile
        ? {
            viewedAt: view.viewedAt,
            profile: applyPrivacy(profile, userId),
          }
        : null;
    })
    .filter(Boolean);
}

// ── Who Viewed My Profile ────────────────────────────────────────────────────

const FREE_VIEWERS_LIMIT = 5; // free users see at most 5 blurred viewers
const PAID_VIEWERS_LIMIT = 50;
const PROFILE_VIEW_NOTIFICATION_TYPE = 'PROFILE_VIEWED';
const PROFILE_VIEW_NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function notifyPaidProfileView(
  viewerId: Types.ObjectId,
  viewedProfile: ProfileDocument,
  viewedAt: Date,
) {
  if (!(await isPaidMember(viewedProfile.userId))) {
    return;
  }

  const cooldownSince = new Date(viewedAt.getTime() - PROFILE_VIEW_NOTIFICATION_COOLDOWN_MS);
  const existing = await NotificationModel.findOne({
    userId: viewedProfile.userId,
    type: PROFILE_VIEW_NOTIFICATION_TYPE,
    createdAt: { $gte: cooldownSince },
    'data.viewerUserId': String(viewerId),
    'data.viewedProfileId': viewedProfile.id,
    isDeleted: false,
  }).lean();

  if (existing) {
    return;
  }

  const viewerProfile = await ProfileModel.findOne({
    userId: viewerId,
    isDeleted: false,
    'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
    'visibility.status': { $ne: ProfileVisibility.HIDDEN },
  }).lean();

  const viewerDisplayName =
    viewerProfile?.personal?.firstName ?? viewerProfile?.displayId ?? 'Someone';

  await createNotification({
    userId: viewedProfile.userId,
    type: PROFILE_VIEW_NOTIFICATION_TYPE,
    title: `${viewerDisplayName} viewed your profile`,
    body: 'See who viewed your profile and continue the conversation.',
    data: {
      viewerUserId: String(viewerId),
      viewerProfileId: viewerProfile ? String(viewerProfile._id) : null,
      viewerDisplayId: viewerProfile?.displayId ?? null,
      viewedProfileId: viewedProfile.id,
      viewedAt: viewedAt.toISOString(),
    },
  });
}

export async function listProfileViewersReceived(userId: Types.ObjectId, isPaidMember: boolean) {
  // First get own profile id so we can look up views by profileUserId
  const ownProfile = await ProfileModel.findOne({ userId, isDeleted: false }).lean();
  if (!ownProfile) {
    throw new HttpError(404, 'Profile not found');
  }

  const limit = isPaidMember ? PAID_VIEWERS_LIMIT : FREE_VIEWERS_LIMIT;

  // Fetch recent distinct viewers (one record per viewer – latest view wins)
  const views = await ProfileViewModel.aggregate<{
    _id: Types.ObjectId; // viewerId
    viewedAt: Date;
    viewerProfileId: Types.ObjectId;
  }>([
    {
      $match: {
        profileUserId: ownProfile._id,
        isDeleted: false,
        // Exclude self-views (shouldn't happen, but defensive)
        viewerId: { $ne: userId },
      },
    },
    { $sort: { viewedAt: -1 } },
    // Deduplicate to one row per viewer, keeping the most recent
    {
      $group: {
        _id: '$viewerId',
        viewedAt: { $first: '$viewedAt' },
        viewerProfileId: { $first: '$profileId' },
      },
    },
    { $sort: { viewedAt: -1 } },
    { $limit: limit },
  ]);

  if (views.length === 0) {
    return { total: 0, isPaid: isPaidMember, viewers: [] };
  }

  const viewerUserIds = views.map((v) => v._id);

  // Fetch viewer profiles (must be approved + visible)
  const viewerProfiles = await ProfileModel.find({
    userId: { $in: viewerUserIds },
    isDeleted: false,
    'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
  }).lean();

  const profileByUserId = new Map(
    viewerProfiles.map((profile) => [String(profile.userId), profile]),
  );

  // Fetch photos for viewer profiles
  const profileIds = viewerProfiles.map((p) => p._id);
  const media = await ProfileMediaModel.find({
      profileId: { $in: profileIds },
      uploadStatus: MediaUploadStatus.UPLOADED,
      approvalStatus: VerificationStatus.APPROVED,
      mediaType: 'PHOTO',
      category: { $in: [MediaCategory.PROFILE_PHOTO, MediaCategory.PUBLIC_GALLERY] },
      visibility: { $in: [MediaVisibility.PUBLIC, MediaVisibility.MATCHES_ONLY] },
      isDeleted: false,
    })
    .sort({ isPrimary: -1, createdAt: -1 })
    .lean();

  const photoByProfileId = new Map<string, string>();
  for (const m of media) {
    const key = String(m.profileId);
    if (!photoByProfileId.has(key)) {
      photoByProfileId.set(key, m.assetUrl);
    }
  }

  // Get total unique viewer count (unfiltered, for the free-tier "X people viewed" teaser)
  const totalCount = await ProfileViewModel.aggregate<{ count: number }>([
    { $match: { profileUserId: ownProfile._id, isDeleted: false, viewerId: { $ne: userId } } },
    { $group: { _id: '$viewerId' } },
    { $count: 'count' },
  ]).then((result) => result[0]?.count ?? 0);

  const viewers = views.map((view) => {
    const profile = profileByUserId.get(String(view._id));

    if (!profile) {
      // Viewer deleted/hidden profile — return blurred stub
      return {
        viewedAt: view.viewedAt,
        blurred: true,
        viewer: null,
      };
    }

    const photoUrl = photoByProfileId.get(String(profile._id));

    if (isPaidMember) {
      // Full details for paid members
      return {
        viewedAt: view.viewedAt,
        blurred: false,
        viewer: {
          id: String(profile._id),
          displayId: profile.displayId,
          firstName: profile.personal?.firstName,
          age: profile.personal?.age,
          city: profile.location?.city,
          state: profile.location?.state,
          occupation: profile.employment?.occupation,
          religion: profile.religion?.religion,
          verificationLevel: profile.verification?.level ?? 'NONE',
          photoUrl: profile.visibility?.showPhoto ? photoUrl : undefined,
        },
      };
    }

    // Free: blurred — no name, no photo, minimal stub
    return {
      viewedAt: view.viewedAt,
      blurred: true,
      viewer: {
        id: null, // hidden
        displayId: null,
        firstName: null,
        age: profile.personal?.age,
        city: profile.location?.state ?? profile.location?.country, // state level only
        religion: profile.religion?.religion,
        verificationLevel: profile.verification?.level ?? 'NONE',
        photoUrl: null,
      },
    };
  });

  return { total: totalCount, isPaid: isPaidMember, viewers };
}

export function applyPrivacy(profile: ProfileDocument, viewerId?: Types.ObjectId) {
  const isOwner = viewerId ? profile.userId.equals(viewerId) : false;
  const data = profile.toObject();

  if (!isOwner) {
    if (!data.visibility.showLastName && data.personal) {
      delete data.personal.lastName;
    }

    if (!data.visibility.showIncome && data.employment) {
      delete data.employment.annualIncome;
    }

    if (!data.visibility.showEmployer && data.employment) {
      delete data.employment.employerName;
    }
  }

  return data;
}

export async function updateAccountSettings(userId: Types.ObjectId, marketingConsent?: boolean) {
  const user = await UserModel.findById(userId).orFail();

  if (typeof marketingConsent === 'boolean') {
    user.marketingConsent = marketingConsent;
    await user.save();
  }

  return user;
}

export async function updateNotificationPreferences(
  userId: Types.ObjectId,
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    marketingNotifications: boolean;
  },
) {
  const user = await UserModel.findById(userId).orFail();
  user.notificationPreferences = preferences;
  await user.save();
  return user.notificationPreferences;
}

export async function deactivateOwnAccount(userId: Types.ObjectId) {
  const now = new Date();
  const [user, profile] = await Promise.all([
    UserModel.findById(userId).orFail(),
    ProfileModel.findOne({ userId, isDeleted: false }),
  ]);

  user.status = AccountStatus.SUSPENDED;
  user.failedLoginAttempts = 0;
  user.refreshTokenVersion += 1;
  user.set('lockUntil', undefined);
  user.set('updatedBy', userId);
  await user.save();

  if (profile) {
    profile.visibility.status = ProfileVisibility.HIDDEN;
    profile.set('updatedBy', userId);
    await profile.save();
  }

  await AuthTokenModel.deleteMany({ userId });

  await Promise.all([
    logAudit({
      actorId: userId,
      actorRole: user.role,
      action: 'ACCOUNT_DEACTIVATED',
      targetType: 'User',
      targetId: userId,
      metadata: { status: AccountStatus.SUSPENDED },
    }),
    logActivity({
      actorId: userId,
      event: 'ACCOUNT_DEACTIVATED',
      metadata: { status: AccountStatus.SUSPENDED, deactivatedAt: now.toISOString() },
    }),
  ]);

  return { user, profile };
}

export async function requestAccountDeletion(userId: Types.ObjectId) {
  const now = new Date();
  const [user, profile] = await Promise.all([
    UserModel.findById(userId).orFail(),
    ProfileModel.findOne({ userId, isDeleted: false }),
  ]);

  user.status = AccountStatus.DELETED;
  user.isDeleted = true;
  user.deletedAt = now;
  user.deletedBy = userId;
  user.failedLoginAttempts = 0;
  user.refreshTokenVersion += 1;
  user.set('lockUntil', undefined);
  user.set('updatedBy', userId);
  await user.save();

  if (profile) {
    profile.visibility.status = ProfileVisibility.HIDDEN;
    profile.isDeleted = true;
    profile.deletedAt = now;
    profile.deletedBy = userId;
    profile.set('updatedBy', userId);
    await profile.save();
  }

  const profileId = profile?._id;

  await Promise.all([
    AuthTokenModel.deleteMany({ userId }),
    ProfileMediaModel.updateMany({ userId }, { $set: { isDeleted: true, deletedAt: now, deletedBy: userId } }),
    InterestModel.updateMany({ $or: [{ senderId: userId }, { recipientId: userId }] }, { $set: { isDeleted: true, deletedAt: now, deletedBy: userId } }),
    FavouriteModel.updateMany({ $or: [{ userId }, ...(profileId ? [{ profileId }] : [])] }, { $set: { isDeleted: true, deletedAt: now, deletedBy: userId } }),
    SavedSearchModel.updateMany({ userId }, { $set: { isDeleted: true, deletedAt: now, deletedBy: userId } }),
    ProfileViewModel.updateMany({ $or: [{ viewerId: userId }, ...(profileId ? [{ profileId }, { profileUserId: profileId }] : [])] }, { $set: { isDeleted: true, deletedAt: now, deletedBy: userId } }),
    BlockModel.updateMany({ $or: [{ blockerId: userId }, { blockedId: userId }] }, { $set: { isDeleted: true, deletedAt: now, deletedBy: userId } }),
  ]);

  try {
    await cancelSubscription(userId);
  } catch (err) {
    // Ignore if no active subscription
  }

  await Promise.all([
    logAudit({
      actorId: userId,
      actorRole: user.role,
      action: 'ACCOUNT_DELETION_REQUESTED',
      targetType: 'User',
      targetId: userId,
      metadata: { status: AccountStatus.DELETED },
    }),
    logActivity({
      actorId: userId,
      event: 'ACCOUNT_DELETION_REQUESTED',
      metadata: { deletedAt: now.toISOString() },
    }),
  ]);

  return { user, profile };
}
