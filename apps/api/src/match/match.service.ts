import {
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
  ProfileVisibility,
  SubscriptionStatus,
  VerificationStatus,
  type ProfileSearchQueryInput,
} from '@vivah/shared';
import { Types } from 'mongoose';
import { HttpError } from '../auth/auth-errors.js';
import {
  BlockModel,
  HiddenProfileModel,
  PlanModel,
  ProfileApprovalStatus,
  ProfileMediaModel,
  ProfileModel,
  SavedSearchModel,
  SubscriptionModel,
} from '../models/index.js';
import type { ProfileDocument } from '../models/profile.model.js';

const FREE_SEARCH_PAGE_SIZE = 10;
const PAID_SEARCH_PAGE_SIZE = 25;
const FREE_RECOMMENDATION_LIMIT = 6;
const PAID_RECOMMENDATION_LIMIT = 20;
const RECOMMENDED_CANDIDATE_LIMIT = 200;

const ADVANCED_FILTER_KEYS: Array<keyof ProfileSearchQueryInput> = [
  'heightMinCm',
  'heightMaxCm',
  'incomeMin',
  'incomeMax',
  'verificationLevel',
  'hasPhoto',
  'visaStatus',
  'citizenshipStatus',
  'dietaryPreference',
  'smokingHabits',
  'drinkingHabits',
  'familyValues',
  'recentlyActive',
  'subscription',
  'dateJoinedAfter',
  'dateJoinedBefore',
];

type ProfileFilter = Record<string, unknown>;

interface SubscriptionLimits {
  planCode: string;
  isPaid: boolean;
  searchPageSize: number;
  recommendationLimit: number;
  advancedFilters: boolean;
}

export interface MatchCard {
  id: string;
  displayId: string;
  firstName?: string | undefined;
  age?: number | undefined;
  heightCm?: number | undefined;
  city?: string | undefined;
  state?: string | undefined;
  country?: string | undefined;
  occupation?: string | undefined;
  education?: string | undefined;
  religion?: string | undefined;
  community?: string | undefined;
  motherTongue?: string | undefined;
  maritalStatus?: string | undefined;
  verificationLevel: string;
  lastActiveAt?: Date | undefined;
  photoUrl?: string | undefined;
  matchScore: number;
  matchReasons: string[];
  isBoosted?: boolean | undefined;
}

export interface ScoredMatch {
  score: number;
  reasons: string[];
}

function verificationPriority(level?: string) {
  switch (level) {
    case 'FULLY_VERIFIED':
      return 7;
    case 'PLATINUM':
      return 6;
    case 'GOLD':
      return 5;
    case 'SILVER':
      return 3;
    case 'BASIC':
      return 1;
    default:
      return 0;
  }
}

function recencyPriority(lastActiveAt?: Date) {
  if (!lastActiveAt) {
    return -6;
  }

  const diffMs = Date.now() - lastActiveAt.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);

  if (diffDays <= 3) return 10;
  if (diffDays <= 14) return 6;
  if (diffDays <= 30) return 3;
  if (diffDays <= 60) return 0;
  return -8;
}

function completionPriority(completionPercentage: number) {
  if (completionPercentage >= 95) return 6;
  if (completionPercentage >= 85) return 3;
  if (completionPercentage >= 75) return 0;
  return -6;
}

function discoveryPriority(profile: ProfileDocument, card: MatchCard) {
  return (
    card.matchScore +
    recencyPriority(profile.stats.lastActiveAt) +
    completionPriority(profile.completionPercentage) +
    verificationPriority(profile.verification.level)
  );
}

function hasValues(value?: unknown[]) {
  return Array.isArray(value) && value.length > 0;
}

function addArrayFilter(filter: ProfileFilter, path: string, value?: string[]) {
  if (hasValues(value)) {
    filter[path] = { $in: value };
  }
}

function hasAdvancedFilters(input: ProfileSearchQueryInput) {
  return ADVANCED_FILTER_KEYS.some((key) => {
    const value = input[key];
    return Array.isArray(value) ? value.length > 0 : value !== undefined;
  });
}

function mapLimits(planCode?: string): SubscriptionLimits {
  const code = planCode ?? 'FREE';
  const isPaid = code !== 'FREE';

  return {
    planCode: code,
    isPaid,
    searchPageSize: isPaid ? PAID_SEARCH_PAGE_SIZE : FREE_SEARCH_PAGE_SIZE,
    recommendationLimit: isPaid ? PAID_RECOMMENDATION_LIMIT : FREE_RECOMMENDATION_LIMIT,
    advancedFilters: isPaid,
  };
}

async function getSubscriptionLimits(userId: Types.ObjectId): Promise<SubscriptionLimits> {
  const now = new Date();
  const subscription = await SubscriptionModel.findOne({
    userId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    startsAt: { $lte: now },
    isDeleted: false,
    $or: [{ endsAt: { $exists: false } }, { endsAt: { $gt: now } }],
  }).sort({ createdAt: -1 });

  if (!subscription) {
    return mapLimits();
  }

  const plan = await PlanModel.findOne({
    _id: subscription.planId,
    active: true,
    isDeleted: false,
  });

  return mapLimits(plan?.code);
}

async function getViewerProfile(userId: Types.ObjectId) {
  const profile = await ProfileModel.findOne({ userId, isDeleted: false });

  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }

  return profile;
}

async function getBlockedUserIds(userId: Types.ObjectId) {
  const blocks = await BlockModel.find({
    isDeleted: false,
    $or: [{ blockerId: userId }, { blockedId: userId }],
  });

  return blocks
    .map((block) => (block.blockerId?.equals(userId) ? block.blockedId : block.blockerId))
    .filter((id): id is Types.ObjectId => Boolean(id));
}

async function getHiddenUserIds(userId: Types.ObjectId) {
  const hiddenProfiles = await HiddenProfileModel.find({
    userId,
    isDeleted: false,
  });

  return hiddenProfiles
    .map((hiddenProfile) => hiddenProfile.hiddenUserId)
    .filter((id): id is Types.ObjectId => Boolean(id));
}

async function getProfileIdsWithApprovedPhoto(profileIds?: Types.ObjectId[]) {
  const filter: Record<string, unknown> = {
    uploadStatus: MediaUploadStatus.UPLOADED,
    approvalStatus: VerificationStatus.APPROVED,
    mediaType: 'PHOTO',
    category: { $in: [MediaCategory.PROFILE_PHOTO, MediaCategory.PUBLIC_GALLERY] },
    visibility: { $in: [MediaVisibility.PUBLIC, MediaVisibility.MATCHES_ONLY] },
    isDeleted: false,
  };

  if (profileIds) {
    filter.profileId = { $in: profileIds };
  }

  return ProfileMediaModel.distinct('profileId', filter);
}

function buildBaseVisibilityFilter(
  viewerProfile: ProfileDocument,
  excludedUserIds: Types.ObjectId[],
): ProfileFilter {
  return {
    _id: { $ne: viewerProfile._id },
    userId: { $nin: [viewerProfile.userId, ...excludedUserIds] },
    isDeleted: false,
    'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
    'visibility.status': { $in: [ProfileVisibility.PUBLIC, ProfileVisibility.MEMBERS_ONLY] },
  };
}

async function buildSearchFilter(
  viewerProfile: ProfileDocument,
  excludedUserIds: Types.ObjectId[],
  input: ProfileSearchQueryInput,
) {
  const filter = buildBaseVisibilityFilter(viewerProfile, excludedUserIds);

  if (input.gender) {
    filter['personal.gender'] = input.gender;
  }

  if (input.ageMin !== undefined || input.ageMax !== undefined) {
    filter['personal.age'] = {
      ...(input.ageMin !== undefined ? { $gte: input.ageMin } : {}),
      ...(input.ageMax !== undefined ? { $lte: input.ageMax } : {}),
    };
  }

  if (input.heightMinCm !== undefined || input.heightMaxCm !== undefined) {
    filter['personal.heightCm'] = {
      ...(input.heightMinCm !== undefined ? { $gte: input.heightMinCm } : {}),
      ...(input.heightMaxCm !== undefined ? { $lte: input.heightMaxCm } : {}),
    };
  }

  if (input.incomeMin !== undefined || input.incomeMax !== undefined) {
    filter['employment.annualIncome'] = {
      ...(input.incomeMin !== undefined ? { $gte: input.incomeMin } : {}),
      ...(input.incomeMax !== undefined ? { $lte: input.incomeMax } : {}),
    };
  }

  addArrayFilter(filter, 'religion.religion', input.religion);
  addArrayFilter(filter, 'religion.community', input.community);
  addArrayFilter(filter, 'religion.caste', input.caste);
  addArrayFilter(filter, 'religion.motherTongue', input.motherTongue);
  addArrayFilter(filter, 'location.country', input.country);
  addArrayFilter(filter, 'location.state', input.state);
  addArrayFilter(filter, 'location.city', input.city);
  addArrayFilter(filter, 'education.highestQualification', input.education);
  addArrayFilter(filter, 'employment.occupation', input.occupation);
  addArrayFilter(filter, 'personal.maritalStatus', input.maritalStatus);
  addArrayFilter(filter, 'location.visaStatus', input.visaStatus);
  addArrayFilter(filter, 'location.citizenshipStatus', input.citizenshipStatus);
  addArrayFilter(filter, 'lifestyle.dietaryPreferences', input.dietaryPreference);
  addArrayFilter(filter, 'lifestyle.smokingHabits', input.smokingHabits);
  addArrayFilter(filter, 'lifestyle.drinkingHabits', input.drinkingHabits);
  addArrayFilter(filter, 'family.familyValues', input.familyValues);

  if (input.verificationLevel) {
    filter['verification.level'] = input.verificationLevel;
  }

  if (input.recentlyActive) {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    filter['stats.lastActiveAt'] = { $gte: since };
  }

  if (input.hasPhoto) {
    filter._id = {
      ...(typeof filter._id === 'object' && filter._id !== null ? filter._id : {}),
      $in: await getProfileIdsWithApprovedPhoto(),
    };
  }

  if (input.subscription && input.subscription.length > 0) {
    const now = new Date();
    const selectedPlans = await PlanModel.find({
      code: { $in: input.subscription },
      isDeleted: false,
    }).lean();
    const selectedPlanIds = selectedPlans.map((p) => p._id);

    const activeSelectedSubs = await SubscriptionModel.find({
      planId: { $in: selectedPlanIds },
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      startsAt: { $lte: now },
      isDeleted: false,
      $or: [{ endsAt: { $exists: false } }, { endsAt: { $gt: now } }],
    }).lean();
    const selectedUserIds = activeSelectedSubs.map((s) => s.userId);

    const paidPlans = await PlanModel.find({
      code: { $ne: 'FREE' },
      isDeleted: false,
    }).lean();
    const paidPlanIds = paidPlans.map((p) => p._id);

    const activePaidSubs = await SubscriptionModel.find({
      planId: { $in: paidPlanIds },
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      startsAt: { $lte: now },
      isDeleted: false,
      $or: [{ endsAt: { $exists: false } }, { endsAt: { $gt: now } }],
    }).lean();
    const paidUserIds = activePaidSubs.map((s) => s.userId);

    const includesFree = input.subscription.includes('FREE');

    if (includesFree) {
      filter.$or = [
        { userId: { $in: selectedUserIds } },
        { userId: { $nin: paidUserIds } },
      ];
    } else {
      filter.userId = {
        ...(typeof filter.userId === 'object' && filter.userId !== null ? filter.userId : {}),
        $in: selectedUserIds,
      };
    }
  }

  if (input.dateJoinedAfter || input.dateJoinedBefore) {
    filter.createdAt = {
      ...(input.dateJoinedAfter ? { $gte: input.dateJoinedAfter } : {}),
      ...(input.dateJoinedBefore ? { $lte: input.dateJoinedBefore } : {}),
    };
  }

  return filter;
}

function sortFor(input: ProfileSearchQueryInput) {
  if (input.sort === 'NEWEST') {
    return { createdAt: -1 } as const;
  }

  if (input.sort === 'RECENTLY_ACTIVE') {
    return { 'stats.lastActiveAt': -1, createdAt: -1 } as const;
  }

  if (input.sort === 'VERIFIED') {
    return { 'verification.level': -1, createdAt: -1 } as const;
  }

  return { 'stats.lastActiveAt': -1, completionPercentage: -1, createdAt: -1 } as const;
}

function intersects(candidate?: unknown[], desired?: unknown[]) {
  if (!candidate?.length || !desired?.length) {
    return false;
  }

  const normalized = new Set(candidate.map((item) => String(item).toLowerCase()));
  return desired.some((item) => normalized.has(String(item).toLowerCase()));
}

function inRange(value?: number, min?: number, max?: number) {
  if (value === undefined) {
    return false;
  }

  if (min !== undefined && value < min) {
    return false;
  }

  if (max !== undefined && value > max) {
    return false;
  }

  return true;
}

function addScore(result: ScoredMatch, points: number, reason: string) {
  result.score += points;
  result.reasons.push(reason);
}

export function calculateMatchScore(
  viewer: ProfileDocument,
  candidate: ProfileDocument,
): ScoredMatch {
  const result: ScoredMatch = { score: 0, reasons: [] };
  const viewerPreference = viewer.partnerPreference ?? {};
  const candidatePreference = candidate.partnerPreference ?? {};

  if (candidate.personal.gender && viewerPreference) {
    addScore(result, 4, `${candidate.personal.gender.toLowerCase().replaceAll('_', ' ')} profile`);
  }

  if (inRange(candidate.personal.age, viewerPreference.ageMin, viewerPreference.ageMax)) {
    addScore(result, 18, 'Age fits your preference');
  }

  if (inRange(viewer.personal.age, candidatePreference.ageMin, candidatePreference.ageMax)) {
    addScore(result, 10, 'Your age fits their preference');
  }

  if (viewer.location.city && candidate.location.city === viewer.location.city) {
    addScore(result, 14, `Both based in ${candidate.location.city}`);
  } else if (viewer.location.state && candidate.location.state === viewer.location.state) {
    addScore(result, 8, `Both in ${candidate.location.state}`);
  }

  if (
    candidate.location.country &&
    viewerPreference.countries?.includes(candidate.location.country)
  ) {
    addScore(result, 8, 'Location fits your preference');
  }

  if (candidate.location.city && viewerPreference.cities?.includes(candidate.location.city)) {
    addScore(result, 8, 'Preferred city match');
  }

  if (
    candidate.religion.religion &&
    viewerPreference.religions?.includes(candidate.religion.religion)
  ) {
    addScore(result, 12, 'Religion preference match');
  } else if (viewer.religion.religion && candidate.religion.religion === viewer.religion.religion) {
    addScore(result, 8, `Shared ${candidate.religion.religion} background`);
  }

  if (
    candidate.religion.community &&
    viewerPreference.communities?.includes(candidate.religion.community)
  ) {
    addScore(result, 8, 'Community preference match');
  }

  if (
    viewer.religion.motherTongue &&
    candidate.religion.motherTongue === viewer.religion.motherTongue
  ) {
    addScore(result, 8, `Same mother tongue: ${candidate.religion.motherTongue}`);
  }

  if (
    candidate.personal.maritalStatus &&
    viewerPreference.maritalStatuses?.includes(candidate.personal.maritalStatus)
  ) {
    addScore(result, 6, 'Marital status fits your preference');
  }

  if (
    candidate.education.highestQualification &&
    viewerPreference.educationLevels?.includes(candidate.education.highestQualification)
  ) {
    addScore(result, 6, 'Education preference match');
  }

  if (
    candidate.employment.occupation &&
    viewerPreference.occupations?.includes(candidate.employment.occupation)
  ) {
    addScore(result, 6, 'Occupation preference match');
  }

  if (intersects(candidate.about.interests, viewer.about.interests)) {
    addScore(result, 8, 'Shared interests');
  }

  if (intersects(candidate.about.hobbies, viewer.about.hobbies)) {
    addScore(result, 6, 'Shared hobbies');
  }

  if (candidate.verification.level !== 'NONE') {
    addScore(result, 4, `${candidate.verification.level.replaceAll('_', ' ')} verification`);
  }

  if (candidate.stats.lastActiveAt) {
    const recentlyActiveSince = new Date();
    recentlyActiveSince.setDate(recentlyActiveSince.getDate() - 30);

    if (candidate.stats.lastActiveAt >= recentlyActiveSince) {
      addScore(result, 5, 'Recently active');
    }
  }

  if (candidate.completionPercentage < 80) {
    result.score -= 8;
  }

  return {
    score: Math.max(0, Math.min(100, result.score)),
    reasons: result.reasons.slice(0, 5),
  };
}

async function approvedPhotoMap(profiles: ProfileDocument[]) {
  const profileIds = profiles.map((profile) => profile._id);
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

  const map = new Map<string, string>();
  for (const item of media) {
    const profileId = String(item.profileId);
    if (!map.has(profileId)) {
      map.set(profileId, item.assetUrl);
    }
  }

  return map;
}

async function toMatchCards(viewer: ProfileDocument, profiles: ProfileDocument[]) {
  const photoByProfile = await approvedPhotoMap(profiles);

  return profiles.map((profile) => {
    const scored = calculateMatchScore(viewer, profile);
    return {
      id: profile.id,
      displayId: profile.displayId,
      verificationLevel: profile.verification.level,
      matchScore: scored.score,
      matchReasons: scored.reasons,
      ...(profile.stats?.activeBoostEndsAt && profile.stats.activeBoostEndsAt > new Date()
        ? { isBoosted: true }
        : {}),
      ...(profile.personal.firstName ? { firstName: profile.personal.firstName } : {}),
      ...(profile.personal.age ? { age: profile.personal.age } : {}),
      ...(profile.personal.heightCm ? { heightCm: profile.personal.heightCm } : {}),
      ...(profile.location.city ? { city: profile.location.city } : {}),
      ...(profile.location.state ? { state: profile.location.state } : {}),
      ...(profile.location.country ? { country: profile.location.country } : {}),
      ...(profile.employment.occupation ? { occupation: profile.employment.occupation } : {}),
      ...(profile.education.highestQualification
        ? { education: profile.education.highestQualification }
        : {}),
      ...(profile.religion.religion ? { religion: profile.religion.religion } : {}),
      ...(profile.religion.community ? { community: profile.religion.community } : {}),
      ...(profile.religion.motherTongue ? { motherTongue: profile.religion.motherTongue } : {}),
      ...(profile.personal.maritalStatus ? { maritalStatus: profile.personal.maritalStatus } : {}),
      ...(profile.stats.lastActiveAt ? { lastActiveAt: profile.stats.lastActiveAt } : {}),
      ...(profile.visibility.showPhoto && photoByProfile.get(profile.id)
        ? { photoUrl: photoByProfile.get(profile.id) }
        : {}),
    };
  });
}

export async function searchProfiles(userId: Types.ObjectId, input: ProfileSearchQueryInput) {
  const [viewerProfile, blockedUserIds, hiddenUserIds, limits] = await Promise.all([
    getViewerProfile(userId),
    getBlockedUserIds(userId),
    getHiddenUserIds(userId),
    getSubscriptionLimits(userId),
  ]);

  if (hasAdvancedFilters(input) && !limits.advancedFilters) {
    throw new HttpError(403, 'Upgrade required for advanced search filters');
  }

  const pageSize = Math.min(input.pageSize, limits.searchPageSize);
  const filter = await buildSearchFilter(
    viewerProfile,
    [...blockedUserIds, ...hiddenUserIds],
    input,
  );
  const total = await ProfileModel.countDocuments(filter);

  if (input.sort === 'RECOMMENDED') {
    const candidates = await ProfileModel.find(filter)
      .sort({ 'stats.lastActiveAt': -1, completionPercentage: -1, createdAt: -1 })
      .limit(RECOMMENDED_CANDIDATE_LIMIT);
    const profileById = new Map(candidates.map((candidate) => [candidate.id, candidate] as const));
    const cards = await toMatchCards(viewerProfile, candidates);
    const results = cards
      .sort((left, right) => {
        if (left.isBoosted && !right.isBoosted) return -1;
        if (!left.isBoosted && right.isBoosted) return 1;
        const leftProfile = profileById.get(left.id);
        const rightProfile = profileById.get(right.id);

        if (leftProfile && rightProfile) {
          return discoveryPriority(rightProfile, right) - discoveryPriority(leftProfile, left);
        }

        return right.matchScore - left.matchScore;
      })
      .slice((input.page - 1) * pageSize, input.page * pageSize);

    return {
      results,
      pagination: { page: input.page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      limits,
    };
  }

  const now = new Date();
  const boostedFilter = { ...filter, 'stats.activeBoostEndsAt': { $gt: now } };
  const standardFilter = { ...filter, $or: [{ 'stats.activeBoostEndsAt': { $lte: now } }, { 'stats.activeBoostEndsAt': { $exists: false } }] };

  const totalBoosted = await ProfileModel.countDocuments(boostedFilter);
  const skip = (input.page - 1) * pageSize;

  let profiles: ProfileDocument[] = [];

  if (skip < totalBoosted) {
    const boosted = await ProfileModel.find(boostedFilter).sort(sortFor(input)).skip(skip).limit(pageSize);
    profiles = profiles.concat(boosted);
  }

  if (profiles.length < pageSize) {
    const standardSkip = Math.max(0, skip - totalBoosted);
    const standardLimit = pageSize - profiles.length;
    const standard = await ProfileModel.find(standardFilter).sort(sortFor(input)).skip(standardSkip).limit(standardLimit);
    profiles = profiles.concat(standard);
  }

  return {
    results: await toMatchCards(viewerProfile, profiles),
    pagination: { page: input.page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    limits,
  };
}

export async function recommendedMatches(userId: Types.ObjectId, requestedLimit: number) {
  const [viewerProfile, blockedUserIds, hiddenUserIds, limits] = await Promise.all([
    getViewerProfile(userId),
    getBlockedUserIds(userId),
    getHiddenUserIds(userId),
    getSubscriptionLimits(userId),
  ]);
  const limit = Math.min(requestedLimit, limits.recommendationLimit);
  const preference = viewerProfile.partnerPreference ?? {};
  const filter = buildBaseVisibilityFilter(viewerProfile, [...blockedUserIds, ...hiddenUserIds]);

  if (viewerProfile.personal.gender === 'MALE') {
    filter['personal.gender'] = 'FEMALE';
  } else if (viewerProfile.personal.gender === 'FEMALE') {
    filter['personal.gender'] = 'MALE';
  }

  if (preference.ageMin !== undefined || preference.ageMax !== undefined) {
    filter['personal.age'] = {
      ...(preference.ageMin !== undefined ? { $gte: preference.ageMin } : {}),
      ...(preference.ageMax !== undefined ? { $lte: preference.ageMax } : {}),
    };
  }

  const candidates = await ProfileModel.find(filter)
    .sort({ 'stats.lastActiveAt': -1, createdAt: -1 })
    .limit(RECOMMENDED_CANDIDATE_LIMIT);
  const profileById = new Map(candidates.map((candidate) => [candidate.id, candidate] as const));

  const results = (await toMatchCards(viewerProfile, candidates))
    .filter((profile) => profile.matchScore > 0)
    .sort((left, right) => {
      if (left.isBoosted && !right.isBoosted) return -1;
      if (!left.isBoosted && right.isBoosted) return 1;
      const leftProfile = profileById.get(left.id);
      const rightProfile = profileById.get(right.id);

      if (leftProfile && rightProfile) {
        return discoveryPriority(rightProfile, right) - discoveryPriority(leftProfile, left);
      }

      return right.matchScore - left.matchScore;
    })
    .slice(0, limit);

  return { results, limits };
}

export async function listSavedSearches(userId: Types.ObjectId) {
  return SavedSearchModel.find({ userId, isDeleted: false })
    .sort({ updatedAt: -1 })
    .select('name query notifyOnNewMatches lastRunAt createdAt updatedAt')
    .lean();
}

export async function createSavedSearch(
  userId: Types.ObjectId,
  input: {
    name: string;
    query: ProfileSearchQueryInput;
    notifyOnNewMatches: boolean;
  },
) {
  const savedSearch = await SavedSearchModel.findOneAndUpdate(
    { userId, name: input.name },
    {
      $set: {
        userId,
        name: input.name,
        query: input.query,
        notifyOnNewMatches: input.notifyOnNewMatches,
        isDeleted: false,
      },
      $unset: { deletedAt: '', deletedBy: '' },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  return savedSearch;
}

export async function deleteSavedSearch(userId: Types.ObjectId, searchId: string) {
  if (!Types.ObjectId.isValid(searchId)) {
    throw new HttpError(404, 'Saved search not found');
  }

  const savedSearch = await SavedSearchModel.findOneAndUpdate(
    { _id: searchId, userId, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userId } },
    { returnDocument: 'after' },
  );

  if (!savedSearch) {
    throw new HttpError(404, 'Saved search not found');
  }
}
