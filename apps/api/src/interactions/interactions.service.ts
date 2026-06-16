import {
  InterestStatus,
  ProfileVisibility,
  ReportStatus,
  SubscriptionStatus,
  type ReportStatus as ReportStatusType,
} from '@vivah/shared';
import mongoose, { Types } from 'mongoose';
import { HttpError } from '../auth/auth-errors.js';
import { recordRepeatedReports, syncReportedUserRiskCounter } from '../common/fraud.service.js';
import {
  BlockModel,
  ConversationModel,
  FavouriteModel,
  InterestModel,
  HiddenProfileModel,
  NotificationModel,
  PlanModel,
  MonthlyInterestCounterModel,
  ProfileApprovalStatus,
  ProfileModel,
  ReportModel,
  SubscriptionModel,
} from '../models/index.js';
import type { ProfileDocument } from '../models/profile.model.js';

const FREE_INTERESTS_PER_MONTH = 5;
const PAID_INTERESTS_PER_MONTH = 50;

type InterestAction = 'ACCEPT' | 'REJECT' | 'WITHDRAW';

function assertObjectId(id: string, message = 'Invalid identifier') {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(404, message);
  }
}

async function activePlanCode(userId: Types.ObjectId) {
  const now = new Date();
  const subscription = await SubscriptionModel.findOne({
    userId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    startsAt: { $lte: now },
    isDeleted: false,
    $or: [{ endsAt: { $exists: false } }, { endsAt: { $gt: now } }],
  }).sort({ createdAt: -1 });

  if (!subscription) {
    return 'FREE';
  }

  const plan = await PlanModel.findOne({
    _id: subscription.planId,
    active: true,
    isDeleted: false,
  });
  return plan?.code ?? 'FREE';
}

async function interestLimitFor(userId: Types.ObjectId) {
  const code = await activePlanCode(userId);
  return code === 'FREE' ? FREE_INTERESTS_PER_MONTH : PAID_INTERESTS_PER_MONTH;
}

async function getTargetProfile(profileId: string) {
  assertObjectId(profileId, 'Profile not found');
  const profile = await ProfileModel.findOne({
    _id: profileId,
    isDeleted: false,
    'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
    'visibility.status': { $in: [ProfileVisibility.PUBLIC, ProfileVisibility.MEMBERS_ONLY] },
  });

  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }

  return profile;
}

function assertNotSelf(viewerId: Types.ObjectId, profile: ProfileDocument) {
  if (profile.userId.equals(viewerId)) {
    throw new HttpError(400, 'Cannot perform this action on your own profile');
  }
}

async function assertNotBlocked(userId: Types.ObjectId, targetUserId: Types.ObjectId) {
  const block = await BlockModel.findOne({
    isDeleted: false,
    $or: [
      { blockerId: userId, blockedId: targetUserId },
      { blockerId: targetUserId, blockedId: userId },
    ],
  });

  if (block) {
    throw new HttpError(403, 'This member is not available');
  }
}

async function assertNotHidden(userId: Types.ObjectId, targetUserId: Types.ObjectId) {
  const hidden = await HiddenProfileModel.findOne({
    userId,
    hiddenUserId: targetUserId,
    isDeleted: false,
  });

  if (hidden) {
    throw new HttpError(409, 'Member is already hidden');
  }
}

async function notify(userId: Types.ObjectId, type: string, title: string, body?: string) {
  await NotificationModel.create({ userId, type, title, ...(body ? { body } : {}) });
}

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function publicProfile(profile: ProfileDocument) {
  return {
    id: profile.id,
    firstName: profile.personal.firstName,
    age: profile.personal.age,
    city: profile.location.city,
    state: profile.location.state,
    country: profile.location.country,
    occupation: profile.employment.occupation,
    verificationLevel: profile.verification.level,
  };
}

async function profileForUser(userId: Types.ObjectId) {
  return ProfileModel.findOne({ userId, isDeleted: false });
}

async function publicInterest(interest: Awaited<ReturnType<typeof InterestModel.findOne>>) {
  if (!interest) {
    return undefined;
  }

  const [senderProfile, receiverProfile] = await Promise.all([
    profileForUser(interest.senderId),
    profileForUser(interest.receiverId),
  ]);

  return {
    id: interest.id,
    status: interest.status,
    respondedAt: interest.respondedAt,
    createdAt: interest.createdAt,
    updatedAt: interest.updatedAt,
    sender: senderProfile ? publicProfile(senderProfile) : undefined,
    receiver: receiverProfile ? publicProfile(receiverProfile) : undefined,
  };
}

export async function sendInterest(userId: Types.ObjectId, profileId: string) {
  const profile = await getTargetProfile(profileId);
  assertNotSelf(userId, profile);
  await assertNotBlocked(userId, profile.userId);

  const existing = await InterestModel.findOne({
    senderId: userId,
    receiverId: profile.userId,
    isDeleted: false,
  });

  if (existing) {
    throw new HttpError(409, 'Interest already exists');
  }

  const reverseInterest = await InterestModel.findOne({
    senderId: profile.userId,
    receiverId: userId,
    status: InterestStatus.PENDING,
    isDeleted: false,
  });

  if (reverseInterest) {
    return respondToInterest(userId, String(reverseInterest._id), 'ACCEPT');
  }

  const limit = await interestLimitFor(userId);
  const nowStr = monthStart().toISOString().substring(0, 7);
  
  const counter = await MonthlyInterestCounterModel.findOneAndUpdate(
    { userId, monthYYYYMM: nowStr },
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );

  if (counter.count > limit) {
    await MonthlyInterestCounterModel.updateOne({ _id: counter._id }, { $inc: { count: -1 } });
    throw new HttpError(403, 'Monthly interest limit reached');
  }

  const interest = await InterestModel.create({
    senderId: userId,
    receiverId: profile.userId,
    status: InterestStatus.PENDING,
  });

  await Promise.all([
    ProfileModel.updateOne({ userId }, { $inc: { 'stats.interestsSent': 1 } }),
    ProfileModel.updateOne({ userId: profile.userId }, { $inc: { 'stats.interestsReceived': 1 } }),
    notify(
      profile.userId,
      'INTEREST_RECEIVED',
      'New interest received',
      'A member has sent you an interest.',
    ),
  ]);

  return publicInterest(interest);
}

export async function respondToInterest(
  userId: Types.ObjectId,
  interestId: string,
  action: InterestAction,
) {
  assertObjectId(interestId, 'Interest not found');
  const interest = await InterestModel.findOne({ _id: interestId, isDeleted: false });

  if (!interest) {
    throw new HttpError(404, 'Interest not found');
  }

  if (action === 'WITHDRAW') {
    if (!interest.senderId.equals(userId)) {
      throw new HttpError(403, 'Only the sender can withdraw this interest');
    }

    if (interest.status !== InterestStatus.PENDING) {
      throw new HttpError(400, 'Only pending interests can be withdrawn');
    }

    interest.status = InterestStatus.WITHDRAWN;
    interest.respondedAt = new Date();
    await interest.save();
    
    const monthStr = new Date(interest.createdAt).toISOString().substring(0, 7);
    await MonthlyInterestCounterModel.updateOne(
      { userId: interest.senderId, monthYYYYMM: monthStr },
      { $inc: { count: -1 } }
    );
    
    await notify(interest.receiverId, 'INTEREST_WITHDRAWN', 'Interest withdrawn');
    return publicInterest(interest);
  }

  if (!interest.receiverId.equals(userId)) {
    throw new HttpError(403, 'Only the receiver can respond to this interest');
  }

  if (interest.status !== InterestStatus.PENDING) {
    throw new HttpError(400, 'Only pending interests can be updated');
  }

  if (action === 'ACCEPT') {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      interest.status = InterestStatus.ACCEPTED;
      interest.respondedAt = new Date();
      await interest.save({ session });

      const existingConversation = await ConversationModel.findOne({
        participantIds: { $all: [interest.senderId, interest.receiverId] },
        isDeleted: false,
      }).session(session);

      if (!existingConversation) {
        const pIds = [String(interest.senderId), String(interest.receiverId)].sort();
        await ConversationModel.create([{
          participantIds: pIds,
        }], { session });
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  } else {
    interest.status = InterestStatus.REJECTED;
    interest.respondedAt = new Date();
    await interest.save();
  }

  await notify(
    interest.senderId,
    action === 'ACCEPT' ? 'INTEREST_ACCEPTED' : 'INTEREST_REJECTED',
    action === 'ACCEPT' ? 'Interest accepted' : 'Interest declined',
  );

  return publicInterest(interest);
}

export async function listInterests(userId: Types.ObjectId, box: 'sent' | 'received', page = 1, limit = 20) {
  const filter =
    box === 'sent'
      ? { senderId: userId, isDeleted: false }
      : { receiverId: userId, isDeleted: false };
      
  const skip = (page - 1) * limit;
  const [interests, total] = await Promise.all([
    InterestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    InterestModel.countDocuments(filter)
  ]);
  
  const mapped = await Promise.all(interests.map((interest) => publicInterest(interest)));
  return {
    interests: mapped,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getInterest(userId: Types.ObjectId, interestId: string) {
  assertObjectId(interestId, 'Interest not found');
  const interest = await InterestModel.findOne({
    _id: interestId,
    isDeleted: false,
    $or: [{ senderId: userId }, { receiverId: userId }],
  });

  if (!interest) {
    throw new HttpError(404, 'Interest not found');
  }

  return publicInterest(interest);
}

export async function addFavourite(userId: Types.ObjectId, profileId: string) {
  const profile = await getTargetProfile(profileId);
  assertNotSelf(userId, profile);
  await assertNotBlocked(userId, profile.userId);

  const existing = await FavouriteModel.findOne({ userId, profileId: profile._id });
  if (existing && !existing.isDeleted) {
    throw new HttpError(409, 'Profile is already in favourites');
  }

  const favourite =
    existing ??
    (await FavouriteModel.create({
      userId,
      profileId: profile._id,
    }));

  if (existing?.isDeleted) {
    existing.isDeleted = false;
    existing.set('deletedAt', undefined);
    existing.set('deletedBy', undefined);
    await existing.save();
  }

  await ProfileModel.updateOne({ _id: profile._id }, { $inc: { 'stats.favouritesCount': 1 } });
  return { id: favourite.id, profile: publicProfile(profile) };
}

export async function removeFavourite(userId: Types.ObjectId, profileId: string) {
  assertObjectId(profileId, 'Profile not found');
  const favourite = await FavouriteModel.findOne({ userId, profileId, isDeleted: false });

  if (!favourite) {
    throw new HttpError(404, 'Favourite not found');
  }

  favourite.isDeleted = true;
  favourite.deletedAt = new Date();
  favourite.deletedBy = userId;
  await favourite.save();
  await ProfileModel.updateOne({ _id: profileId }, { $inc: { 'stats.favouritesCount': -1 } });
}

export async function getInteractionStatus(userId: Types.ObjectId, profileId: string) {
  assertObjectId(profileId, 'Profile not found');

  const profile = await ProfileModel.findOne({ _id: profileId, isDeleted: false });
  if (!profile) {
    return { interestStatus: null, interestId: null, isFavourited: false, isHidden: false };
  }

  const [interest, favourite, hidden] = await Promise.all([
    InterestModel.findOne({
      $or: [
        { senderId: userId, receiverId: profile.userId },
        { senderId: profile.userId, receiverId: userId }
      ],
      isDeleted: false
    }),
    FavouriteModel.findOne({ userId, profileId: profile._id, isDeleted: false }),
    HiddenProfileModel.findOne({ userId, profileId: profile._id, isDeleted: false }),
  ]);

  return {
    interestStatus: interest?.status ?? null,
    interestId: interest ? String(interest._id) : null,
    isSender: interest ? interest.senderId.equals(userId) : false,
    isFavourited: Boolean(favourite),
    isHidden: Boolean(hidden),
  };
}

export async function listFavourites(userId: Types.ObjectId) {
  const favourites = await FavouriteModel.find({ userId, isDeleted: false }).sort({
    createdAt: -1,
  });
  const profiles = await ProfileModel.find({
    _id: { $in: favourites.map((favourite) => favourite.profileId) },
    isDeleted: false,
  });
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));

  return favourites
    .map((favourite) => {
      const profile = byId.get(String(favourite.profileId));
      return profile ? { id: favourite.id, profile: publicProfile(profile) } : undefined;
    })
    .filter(Boolean);
}

export async function blockProfile(userId: Types.ObjectId, profileId: string) {
  const profile = await getTargetProfile(profileId);
  assertNotSelf(userId, profile);

  const existing = await BlockModel.findOne({
    blockerId: userId,
    blockedId: profile.userId,
  });

  if (existing && !existing.isDeleted) {
    throw new HttpError(409, 'Member is already blocked');
  }

  const block =
    existing ?? (await BlockModel.create({ blockerId: userId, blockedId: profile.userId }));

  if (existing?.isDeleted) {
    existing.isDeleted = false;
    existing.set('deletedAt', undefined);
    existing.set('deletedBy', undefined);
    await existing.save();
  }

  await InterestModel.updateMany(
    {
      isDeleted: false,
      status: InterestStatus.PENDING,
      $or: [
        { senderId: userId, receiverId: profile.userId },
        { senderId: profile.userId, receiverId: userId },
      ],
    },
    { $set: { status: InterestStatus.WITHDRAWN, respondedAt: new Date() } },
  );

  return { id: block.id, profile: publicProfile(profile) };
}

export async function unblockProfile(userId: Types.ObjectId, profileId: string) {
  const profile = await ProfileModel.findOne({ _id: profileId, isDeleted: false });
  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }

  const block = await BlockModel.findOne({
    blockerId: userId,
    blockedId: profile.userId,
    isDeleted: false,
  });
  if (!block) {
    throw new HttpError(404, 'Block not found');
  }

  block.isDeleted = true;
  block.deletedAt = new Date();
  block.deletedBy = userId;
  await block.save();
}

export async function listBlocks(userId: Types.ObjectId) {
  const blocks = await BlockModel.find({ blockerId: userId, isDeleted: false }).sort({
    createdAt: -1,
  });
  const blockedIds = blocks
    .map((block) => block.blockedId)
    .filter((id): id is Types.ObjectId => Boolean(id));
  const profiles = await ProfileModel.find({
    userId: { $in: blockedIds },
    isDeleted: false,
  });
  const byUser = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  return blocks
    .map((block) => {
      const profile = block.blockedId ? byUser.get(String(block.blockedId)) : undefined;
      return profile ? { id: block.id, profile: publicProfile(profile) } : undefined;
    })
    .filter(Boolean);
}

export async function hideProfile(userId: Types.ObjectId, profileId: string) {
  const profile = await getTargetProfile(profileId);
  assertNotSelf(userId, profile);
  await assertNotBlocked(userId, profile.userId);
  await assertNotHidden(userId, profile.userId);

  const existing = await HiddenProfileModel.findOne({
    userId,
    profileId: profile._id,
  });

  const hiddenProfile =
    existing ?? (await HiddenProfileModel.create({ userId, profileId: profile._id, hiddenUserId: profile.userId }));

  if (existing?.isDeleted) {
    existing.isDeleted = false;
    existing.set('deletedAt', undefined);
    existing.set('deletedBy', undefined);
    await existing.save();
  }

  return { id: hiddenProfile.id, profile: publicProfile(profile) };
}

export async function unhideProfile(userId: Types.ObjectId, profileId: string) {
  const profile = await ProfileModel.findOne({ _id: profileId, isDeleted: false });
  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }

  const hiddenProfile = await HiddenProfileModel.findOne({
    userId,
    profileId: profile._id,
    isDeleted: false,
  });
  if (!hiddenProfile) {
    throw new HttpError(404, 'Hidden profile not found');
  }

  hiddenProfile.isDeleted = true;
  hiddenProfile.deletedAt = new Date();
  hiddenProfile.deletedBy = userId;
  await hiddenProfile.save();
}

export async function listHiddenProfiles(userId: Types.ObjectId) {
  const hiddenProfiles = await HiddenProfileModel.find({ userId, isDeleted: false }).sort({
    createdAt: -1,
  });
  const hiddenIds = hiddenProfiles
    .map((hiddenProfile) => hiddenProfile.hiddenUserId)
    .filter((id): id is Types.ObjectId => Boolean(id));
  const profiles = await ProfileModel.find({
    userId: { $in: hiddenIds },
    isDeleted: false,
  });
  const byUser = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  return hiddenProfiles
    .map((hiddenProfile) => {
      const profile = hiddenProfile.hiddenUserId ? byUser.get(String(hiddenProfile.hiddenUserId)) : undefined;
      return profile ? { id: hiddenProfile.id, profile: publicProfile(profile) } : undefined;
    })
    .filter(Boolean);
}

export async function createReport(
  userId: Types.ObjectId,
  input: {
    targetType: 'PROFILE' | 'MEDIA' | 'MESSAGE' | 'USER' | 'POST' | 'COMMENT';
    targetId?: string;
    profileId?: string;
    reason: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  },
) {
  const profileId =
    input.profileId ?? (input.targetType === 'PROFILE' ? input.targetId : undefined);
  let reportedUserId: Types.ObjectId | undefined;

  if (profileId) {
    const profile = await ProfileModel.findOne({ _id: profileId, isDeleted: false });
    if (!profile) {
      throw new HttpError(404, 'Profile not found');
    }
    assertNotSelf(userId, profile);
    reportedUserId = profile.userId;
  }

  const targetId = input.targetId ?? profileId;
  if (targetId) {
    assertObjectId(targetId, 'Target not found');
  }

  const reportPayload = {
    reporterId: userId,
    targetType: input.targetType,
    reason: input.reason,
    severity: input.severity,
    ...(reportedUserId ? { reportedUserId } : {}),
    ...(targetId ? { targetId } : {}),
  };
  const report = new ReportModel(reportPayload);
  await report.save();
  if (reportedUserId) {
    await syncReportedUserRiskCounter(reportedUserId);
  }

  await notify(userId, 'REPORT_SUBMITTED', 'Report submitted', 'Our safety team will review it.');

  const reportCount = await ReportModel.countDocuments({
    reporterId: userId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    isDeleted: false,
  });

  if (reportCount >= 5) {
    await recordRepeatedReports({
      reporterId: userId,
      reportCount,
      ...(targetId ? { targetId } : {}),
    });
  }

  return {
    id: report.id,
    status: report.status,
    severity: report.severity,
    targetType: report.targetType,
    createdAt: report.createdAt,
  };
}

export async function listReports(status: ReportStatusType = ReportStatus.OPEN) {
  return ReportModel.find({ status, isDeleted: false }).sort({ createdAt: -1 }).limit(100);
}

export async function reviewReport(
  adminId: Types.ObjectId,
  reportId: string,
  action: 'ASSIGN' | 'RESOLVE' | 'DISMISS',
) {
  assertObjectId(reportId, 'Report not found');
  const report = await ReportModel.findOne({ _id: reportId, isDeleted: false });

  if (!report) {
    throw new HttpError(404, 'Report not found');
  }

  if (action === 'ASSIGN') {
    report.status = 'ASSIGNED';
    report.assignedTo = adminId;
  } else {
    report.status = action === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED';
  }

  await report.save();
  if (report.reportedUserId) {
    await syncReportedUserRiskCounter(report.reportedUserId);
  }
  return report;
}
