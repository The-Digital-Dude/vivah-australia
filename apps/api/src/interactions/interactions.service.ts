import {
  AccountStatus,
  InterestStatus,
  ProfileVisibility,
  ReportStatus,
  SubscriptionStatus,
  type ReportStatus as ReportStatusType,
} from '@vivah/shared';
import { Types, type ClientSession, type HydratedDocument } from 'mongoose';
import { HttpError } from '../auth/auth-errors.js';
import { recordRepeatedReports, syncReportedUserRiskCounter } from '../common/fraud.service.js';
import { runInTransaction } from '../common/mongo-transactions.js';
import { pairKeyForUsers } from '../common/pair-key.js';
import { disconnectMessageSocketsForPair } from '../messages/messages.realtime.js';
import {
  BlockModel,
  CommunityCommentModel,
  CommunityPostModel,
  ConversationModel,
  FavouriteModel,
  InterestModel,
  HiddenProfileModel,
  MessageModel,
  PlanModel,
  MonthlyInterestCounterModel,
  ProfileApprovalStatus,
  ProfileMediaModel,
  ProfileModel,
  ReportModel,
  SubscriptionModel,
  UserModel,
  type Interest,
} from '../models/index.js';
import type { ProfileDocument } from '../models/profile.model.js';
import { createNotification } from '../notifications/notifications.service.js';

const FREE_INTERESTS_PER_MONTH = 5;
const PAID_INTERESTS_PER_MONTH = 50;
const QUOTA_COUNTED_STATUSES = new Set<string>([InterestStatus.PENDING, InterestStatus.ACCEPTED]);

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
    userStatus: AccountStatus.ACTIVE,
    userIsDeleted: false,
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
  const webBaseUrl = process.env.WEB_BASE_URL ?? 'http://localhost:3000';
  const configByType: Record<
    string,
    {
      emailTemplateKey?: string;
      emailTemplateContext?: Record<string, unknown>;
      emailSubject?: string;
      emailBody?: string;
      smsBody?: string;
    }
  > = {
    INTEREST_RECEIVED: {
      emailTemplateKey: 'NOTIFICATION_INTEREST_RECEIVED',
      emailTemplateContext: { actionUrl: `${webBaseUrl}/member/activity` },
      emailSubject: 'You have a new interest on Vivah Australia',
      emailBody: 'A member has sent you an interest on Vivah Australia. Log in to review it.',
      smsBody: 'You have a new interest on Vivah Australia. Log in to review it.',
    },
    INTEREST_ACCEPTED: {
      emailTemplateKey: 'NOTIFICATION_INTEREST_ACCEPTED',
      emailTemplateContext: { actionUrl: `${webBaseUrl}/member/messages` },
      emailSubject: 'Your interest was accepted on Vivah Australia',
      emailBody: 'Your interest was accepted on Vivah Australia. You can now start the conversation.',
      smsBody: 'Your interest was accepted on Vivah Australia. You can now start the conversation.',
    },
  };
  const config = configByType[type] ?? {};

  await createNotification({
    userId,
    type,
    title,
    ...(body ? { body } : {}),
    ...(config.emailTemplateKey ? { emailTemplateKey: config.emailTemplateKey } : {}),
    ...(config.emailTemplateContext ? { emailTemplateContext: config.emailTemplateContext } : {}),
    emailSubject: config.emailSubject ?? title,
    emailBody: config.emailBody ?? body ?? title,
    ...(config.smsBody ? { smsBody: config.smsBody } : {}),
    pushBody: body ?? title,
  });
}

function monthKey(date = new Date()) {
  return date.toISOString().substring(0, 7);
}

function isQuotaCountedStatus(status: string) {
  return QUOTA_COUNTED_STATUSES.has(status);
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    Number((error as { code?: unknown }).code) === 11000
  );
}

async function safeNotify(userId: Types.ObjectId, type: string, title: string, body?: string) {
  try {
    await notify(userId, type, title, body);
  } catch (error) {
    console.error(`[interests] Failed to create ${type} notification`, error);
  }
}

async function getInterestCounterValue(userId: Types.ObjectId, when = new Date()) {
  const counter = await MonthlyInterestCounterModel.findOne({
    userId,
    monthYYYYMM: monthKey(when),
  }).lean();
  return counter?.count ?? 0;
}

async function adjustMonthlyInterestCounter(
  userId: Types.ObjectId,
  when: Date,
  delta: number,
  session?: ClientSession,
) {
  const counterMonth = monthKey(when);

  const counter = await MonthlyInterestCounterModel.findOneAndUpdate(
    { userId, monthYYYYMM: counterMonth },
    [
      {
        $set: {
          count: {
            $max: [0, { $add: [{ $ifNull: ['$count', 0] }, delta] }],
          },
        },
      },
    ],
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
      updatePipeline: true,
      ...(session ? { session } : {}),
    },
  );

  return counter?.count ?? 0;
}

async function transitionInterestStatus(
  interest: HydratedDocument<Interest>,
  nextStatus: InterestStatus,
  respondedAt: Date,
  session?: ClientSession,
) {
  const previousStatus = interest.status;
  interest.status = nextStatus;
  interest.respondedAt = respondedAt;
  if (session) {
    await interest.save({ session });
  } else {
    await interest.save();
  }

  if (isQuotaCountedStatus(previousStatus) && !isQuotaCountedStatus(nextStatus)) {
    await adjustMonthlyInterestCounter(interest.senderId, interest.createdAt, -1, session);
  }
}

async function findInterestByPair(
  senderId: Types.ObjectId,
  receiverId: Types.ObjectId,
  session?: ClientSession,
) {
  const query = InterestModel.findOne({
    isDeleted: false,
    $or: [
      { pairKey: pairKeyForUsers(senderId, receiverId) },
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
  });

  if (session) {
    query.session(session);
  }

  return query;
}

async function ensureConversationByPair(
  firstUserId: Types.ObjectId,
  secondUserId: Types.ObjectId,
  session?: ClientSession,
) {
  const participantIds = [firstUserId, secondUserId].sort((a, b) =>
    a.toString().localeCompare(b.toString()),
  );
  return ConversationModel.findOneAndUpdate(
    { pairKey: pairKeyForUsers(firstUserId, secondUserId) },
    {
      $setOnInsert: {
        participantIds,
        pairKey: pairKeyForUsers(firstUserId, secondUserId),
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, ...(session ? { session } : {}) },
  );
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

function reportableProfileSnapshot(profile: Awaited<ReturnType<typeof ProfileModel.findOne>>) {
  if (!profile) {
    return null;
  }
  return {
    profileId: profile.id,
    displayId: profile.displayId,
    firstName: profile.personal.firstName,
    lastName: profile.personal.lastName,
    city: profile.location.city,
    state: profile.location.state,
    verificationLevel: profile.verification.level,
    approvalStatus: profile.moderation.approvalStatus,
  };
}

type ResolvedReportTarget = {
  targetId: Types.ObjectId;
  reportedUserId?: Types.ObjectId;
  targetSnapshot: Record<string, unknown>;
};

async function resolveReportTarget(
  userId: Types.ObjectId,
  input: {
    targetType: 'PROFILE' | 'MEDIA' | 'MESSAGE' | 'USER' | 'POST' | 'COMMENT';
    targetId?: string;
    profileId?: string;
  },
): Promise<ResolvedReportTarget> {
  const requestedTargetId = input.profileId ?? input.targetId;
  if (!requestedTargetId) {
    throw new HttpError(400, 'A report target is required');
  }
  assertObjectId(requestedTargetId, 'Target not found');

  if (input.targetType === 'PROFILE') {
    const profile = await ProfileModel.findOne({ _id: requestedTargetId, isDeleted: false });
    if (!profile) {
      throw new HttpError(404, 'Profile not found');
    }
    assertNotSelf(userId, profile);
    return {
      targetId: profile._id,
      reportedUserId: profile.userId,
      targetSnapshot: {
        type: 'PROFILE',
        profile: reportableProfileSnapshot(profile),
      },
    };
  }

  if (input.targetType === 'USER') {
    const user = await UserModel.findOne({ _id: requestedTargetId, isDeleted: false });
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    if (String(user._id) === String(userId)) {
      throw new HttpError(400, 'You cannot report yourself');
    }
    const profile = await profileForUser(user._id);
    return {
      targetId: user._id,
      reportedUserId: user._id,
      targetSnapshot: {
        type: 'USER',
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
        },
        profile: reportableProfileSnapshot(profile),
      },
    };
  }

  if (input.targetType === 'MEDIA') {
    const media = await ProfileMediaModel.findOne({ _id: requestedTargetId, isDeleted: false });
    if (!media) {
      throw new HttpError(404, 'Media not found');
    }
    if (String(media.userId) === String(userId)) {
      throw new HttpError(400, 'You cannot report your own media');
    }
    const profile = await ProfileModel.findOne({ _id: media.profileId, isDeleted: false });
    return {
      targetId: media._id,
      reportedUserId: media.userId,
      targetSnapshot: {
        type: 'MEDIA',
        media: {
          id: media.id,
          category: media.category,
          mediaType: media.mediaType,
          mimeType: media.mimeType,
          visibility: media.visibility,
          approvalStatus: media.approvalStatus,
          profileId: String(media.profileId),
        },
        profile: reportableProfileSnapshot(profile),
      },
    };
  }

  if (input.targetType === 'MESSAGE') {
    const message = await MessageModel.findOne({ _id: requestedTargetId, isDeleted: false });
    if (!message) {
      throw new HttpError(404, 'Message not found');
    }
    const conversation = await ConversationModel.findOne({
      _id: message.conversationId,
      participantIds: userId,
      isDeleted: false,
      deletedFor: { $ne: userId },
    });
    if (!conversation) {
      throw new HttpError(404, 'Message not found');
    }
    if (String(message.senderId) === String(userId)) {
      throw new HttpError(400, 'You cannot report your own message');
    }
    const senderProfile = await profileForUser(message.senderId);
    return {
      targetId: message._id,
      reportedUserId: message.senderId,
      targetSnapshot: {
        type: 'MESSAGE',
        message: {
          id: message.id,
          conversationId: String(message.conversationId),
          bodyExcerpt: typeof message.body === 'string' ? message.body.slice(0, 200) : '',
          attachmentCount: message.attachmentIds?.length ?? 0,
          createdAt: message.createdAt,
        },
        senderProfile: reportableProfileSnapshot(senderProfile),
      },
    };
  }

  if (input.targetType === 'POST') {
    const post = await CommunityPostModel.findOne({ _id: requestedTargetId, isDeleted: false });
    if (!post) {
      throw new HttpError(404, 'Post not found');
    }
    if (String(post.authorId) === String(userId)) {
      throw new HttpError(400, 'You cannot report your own post');
    }
    const authorProfile = await profileForUser(post.authorId);
    return {
      targetId: post._id,
      reportedUserId: post.authorId,
      targetSnapshot: {
        type: 'POST',
        post: {
          id: post.id,
          title: post.title,
          bodyExcerpt: post.body.slice(0, 240),
          status: post.status,
          createdAt: post.createdAt,
        },
        authorProfile: reportableProfileSnapshot(authorProfile),
      },
    };
  }

  const comment = await CommunityCommentModel.findOne({ _id: requestedTargetId, isDeleted: false });
  if (!comment) {
    throw new HttpError(404, 'Comment not found');
  }
  if (String(comment.authorId) === String(userId)) {
    throw new HttpError(400, 'You cannot report your own comment');
  }
  const [post, authorProfile] = await Promise.all([
    CommunityPostModel.findOne({ _id: comment.postId, isDeleted: false }),
    profileForUser(comment.authorId),
  ]);
  if (!post) {
    throw new HttpError(404, 'Comment not found');
  }
  return {
    targetId: comment._id,
    reportedUserId: comment.authorId,
    targetSnapshot: {
      type: 'COMMENT',
      comment: {
        id: comment.id,
        postId: String(comment.postId),
        bodyExcerpt: comment.body.slice(0, 200),
        createdAt: comment.createdAt,
      },
      post: {
        id: post.id,
        title: post.title,
      },
      authorProfile: reportableProfileSnapshot(authorProfile),
    },
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
  const limit = await interestLimitFor(userId);

  try {
    const { resultInterestId, shouldNotifyReceiver, shouldNotifySender } =
      await runInTransaction(async (session) => {
        let resultInterestId: string | null = null;
        let shouldNotifyReceiver = false;
        let shouldNotifySender = false;

        const existing = await findInterestByPair(userId, profile.userId, session);

        if (existing) {
          if (existing.senderId.equals(userId)) {
            throw new HttpError(409, 'Interest already exists');
          }

          if (existing.status === InterestStatus.PENDING) {
            await transitionInterestStatus(existing, InterestStatus.ACCEPTED, new Date(), session);
            await ensureConversationByPair(existing.senderId, existing.receiverId, session);

            resultInterestId = existing.id;
            shouldNotifySender = true;
            return { resultInterestId, shouldNotifyReceiver, shouldNotifySender };
          }

          throw new HttpError(409, 'Interest already exists');
        }

        const nextCount = await adjustMonthlyInterestCounter(userId, new Date(), 1, session);
        if (nextCount > limit) {
          await adjustMonthlyInterestCounter(userId, new Date(), -1, session);
          throw new HttpError(403, 'Monthly interest limit reached');
        }

        let interest: HydratedDocument<Interest> | null = null;
        if (session) {
          const createdInterests = await InterestModel.create(
            [
              {
                senderId: userId,
                receiverId: profile.userId,
                pairKey: pairKeyForUsers(userId, profile.userId),
                status: InterestStatus.PENDING,
              },
            ],
            { session },
          );
          interest = createdInterests[0] ?? null;
        } else {
          interest = await InterestModel.create({
            senderId: userId,
            receiverId: profile.userId,
            pairKey: pairKeyForUsers(userId, profile.userId),
            status: InterestStatus.PENDING,
          });
        }

        if (!interest) {
          throw new HttpError(500, 'Interest could not be created');
        }

        if (session) {
          await Promise.all([
            ProfileModel.updateOne({ userId }, { $inc: { 'stats.interestsSent': 1 } }, { session }),
            ProfileModel.updateOne(
              { userId: profile.userId },
              { $inc: { 'stats.interestsReceived': 1 } },
              { session },
            ),
          ]);
        } else {
          await Promise.all([
            ProfileModel.updateOne({ userId }, { $inc: { 'stats.interestsSent': 1 } }),
            ProfileModel.updateOne(
              { userId: profile.userId },
              { $inc: { 'stats.interestsReceived': 1 } },
            ),
          ]);
        }

        resultInterestId = interest.id;
        shouldNotifyReceiver = true;
        return { resultInterestId, shouldNotifyReceiver, shouldNotifySender };
      });

    const interest = resultInterestId
      ? await InterestModel.findById(resultInterestId)
      : await findInterestByPair(userId, profile.userId);

    if (!interest) {
      throw new HttpError(500, 'Interest could not be loaded');
    }

    if (shouldNotifyReceiver) {
      await safeNotify(
        profile.userId,
        'INTEREST_RECEIVED',
        'New interest received',
        'A member has sent you an interest.',
      );
    }

    if (shouldNotifySender) {
      await safeNotify(userId, 'INTEREST_ACCEPTED', 'Interest accepted');
    }

    return publicInterest(interest);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const existing = await findInterestByPair(userId, profile.userId);
      if (existing?.senderId.equals(profile.userId) && existing.status === InterestStatus.PENDING) {
        return respondToInterest(userId, String(existing._id), 'ACCEPT');
      }
    }
    throw error;
  }
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

    await transitionInterestStatus(interest, InterestStatus.WITHDRAWN, new Date());
    await safeNotify(interest.receiverId, 'INTEREST_WITHDRAWN', 'Interest withdrawn');
    return publicInterest(interest);
  }

  if (!interest.receiverId.equals(userId)) {
    throw new HttpError(403, 'Only the receiver can respond to this interest');
  }

  if (interest.status !== InterestStatus.PENDING) {
    throw new HttpError(400, 'Only pending interests can be updated');
  }

  if (action === 'ACCEPT') {
    await runInTransaction(async (session) => {
      const currentInterest = session
        ? await InterestModel.findOne({ _id: interestId, isDeleted: false }).session(session)
        : await InterestModel.findOne({ _id: interestId, isDeleted: false });
      if (!currentInterest) {
        throw new HttpError(404, 'Interest not found');
      }
      if (currentInterest.status !== InterestStatus.PENDING) {
        throw new HttpError(400, 'Only pending interests can be updated');
      }

      await transitionInterestStatus(currentInterest, InterestStatus.ACCEPTED, new Date(), session);

      await ensureConversationByPair(currentInterest.senderId, currentInterest.receiverId, session);
    });
    interest.status = InterestStatus.ACCEPTED;
    interest.respondedAt = new Date();
  } else {
    await transitionInterestStatus(interest, InterestStatus.REJECTED, new Date());
  }

  await safeNotify(
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

  const block = await runInTransaction(async (session) => {
      const currentBlock =
        existing ??
        (session
          ? await BlockModel.findOne({
              blockerId: userId,
              blockedId: profile.userId,
            }).session(session)
          : await BlockModel.findOne({
              blockerId: userId,
              blockedId: profile.userId,
            }));

      let nextBlock = currentBlock;
      if (!nextBlock) {
        nextBlock = new BlockModel({ blockerId: userId, blockedId: profile.userId });
        await nextBlock.save(session ? { session } : undefined);
      } else if (nextBlock.isDeleted) {
        nextBlock.isDeleted = false;
        nextBlock.set('deletedAt', undefined);
        nextBlock.set('deletedBy', undefined);
        await nextBlock.save(session ? { session } : undefined);
      }

      if (!nextBlock) {
        throw new HttpError(500, 'Block could not be created');
      }

      const interestsQuery = InterestModel.find({
        isDeleted: false,
        $or: [
          { senderId: userId, receiverId: profile.userId },
          { senderId: profile.userId, receiverId: userId },
        ],
      });
      if (session) {
        interestsQuery.session(session);
      }
      const interests = await interestsQuery;

      const respondedAt = new Date();
      for (const interest of interests) {
        if (interest.status === InterestStatus.WITHDRAWN) {
          continue;
        }
        await transitionInterestStatus(interest, InterestStatus.WITHDRAWN, respondedAt, session);
      }
      return nextBlock;
    });

  // Look up the shared conversation (if any) so we can emit conversation:locked
  // to both parties before cutting their sockets.
  const sharedConversation = await ConversationModel.findOne({
    participantIds: { $all: [userId, profile.userId] },
    isDeleted: false,
  })
    .select('_id')
    .lean();

  disconnectMessageSocketsForPair(
    userId,
    profile.userId,
    'blocked',
    sharedConversation ? String(sharedConversation._id) : undefined,
  );

  return { id: block.id, profile: publicProfile(profile) };
}


export async function getInterestQuotaSummary(userId: Types.ObjectId) {
  const [limit, used] = await Promise.all([
    interestLimitFor(userId),
    getInterestCounterValue(userId),
  ]);

  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    month: monthKey(),
  };
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
  const resolved = await resolveReportTarget(userId, input);

  const reportPayload = {
    reporterId: userId,
    targetType: input.targetType,
    reason: input.reason,
    severity: input.severity,
    ...(resolved.reportedUserId ? { reportedUserId: resolved.reportedUserId } : {}),
    targetId: resolved.targetId,
    targetSnapshot: resolved.targetSnapshot,
  };
  const report = new ReportModel(reportPayload);
  await report.save();
  if (resolved.reportedUserId) {
    await syncReportedUserRiskCounter(resolved.reportedUserId);
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
      targetId: String(resolved.targetId),
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
  const reports = await ReportModel.find({ status, isDeleted: false }).sort({ createdAt: -1 }).limit(100);
  const userIds = new Set<string>();
  for (const report of reports) {
    userIds.add(String(report.reporterId));
    if (report.reportedUserId) {
      userIds.add(String(report.reportedUserId));
    }
    if (report.assignedTo) {
      userIds.add(String(report.assignedTo));
    }
  }

  const [users, profiles] = await Promise.all([
    UserModel.find({ _id: { $in: [...userIds].map((id) => new Types.ObjectId(id)) }, isDeleted: false }),
    ProfileModel.find({ userId: { $in: [...userIds].map((id) => new Types.ObjectId(id)) }, isDeleted: false }),
  ]);
  const userById = new Map(users.map((user) => [String(user._id), user]));
  const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  return reports.map((report) => {
    const reporter = userById.get(String(report.reporterId)) ?? null;
    const reportedUser = report.reportedUserId ? userById.get(String(report.reportedUserId)) ?? null : null;
    const assignedTo = report.assignedTo ? userById.get(String(report.assignedTo)) ?? null : null;

    return {
      _id: report.id,
      targetType: report.targetType,
      targetId: report.targetId ? String(report.targetId) : undefined,
      reason: report.reason,
      severity: report.severity,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reporterId: String(report.reporterId),
      reportedUserId: report.reportedUserId ? String(report.reportedUserId) : undefined,
      assignedTo: report.assignedTo ? String(report.assignedTo) : undefined,
      reporter: reporter
        ? {
            id: reporter.id,
            email: reporter.email,
            status: reporter.status,
            profile: reportableProfileSnapshot(profileByUserId.get(String(reporter._id)) ?? null),
          }
        : null,
      reportedMember: reportedUser
        ? {
            id: reportedUser.id,
            email: reportedUser.email,
            status: reportedUser.status,
            profile: reportableProfileSnapshot(profileByUserId.get(String(reportedUser._id)) ?? null),
          }
        : null,
      assignedModerator: assignedTo
        ? {
            id: assignedTo.id,
            email: assignedTo.email,
          }
        : null,
      evidence: report.targetSnapshot ?? null,
    };
  });
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
