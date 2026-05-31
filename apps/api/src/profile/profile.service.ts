import { ProfileVisibility, type ProfileDraftInput } from '@vivah/shared';
import { Types } from 'mongoose';
import { HttpError } from '../auth/auth-errors.js';
import { BlockModel, ProfileApprovalStatus, ProfileModel, UserModel } from '../models/index.js';
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
  if (!Types.ObjectId.isValid(profileId)) {
    throw new HttpError(404, 'Profile not found');
  }

  const profile = await ProfileModel.findOne({
    _id: profileId,
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

  return applyPrivacy(profile, viewerId);
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
