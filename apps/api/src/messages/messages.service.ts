import crypto from 'node:crypto';
import {
  AccountStatus,
  InterestStatus,
  MediaUploadStatus,
  ProfileVisibility,
  type MessageAttachmentCompleteUploadInput,
  type MessageAttachmentSignUploadInput,
  type MessageCreateInput,
} from '@vivah/shared';
import { Types } from 'mongoose';
import { HttpError } from '../auth/auth-errors.js';
import { recordUnusualMessageVolume } from '../common/fraud.service.js';
import {
  BlockModel,
  ConversationModel,
  InterestModel,
  MessageAttachmentModel,
  MessageModel,
  NotificationModel,
  ProfileApprovalStatus,
  ProfileModel,
  UserModel,
} from '../models/index.js';
import type { ConversationDocument, MessageDocument } from '../models/phase-one.models.js';
import { runInTransaction } from '../common/mongo-transactions.js';

const UPLOAD_TTL_SECONDS = 10 * 60;
const ACCESS_TTL_SECONDS = 5 * 60;
const LOCAL_UPLOAD_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
const HOURLY_MESSAGE_LIMIT = 50;
const ATTACHMENT_MIME_ALLOWLIST = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function envValue(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function cloudinaryConfig() {
  const cloudName = envValue('CLOUDINARY_CLOUD_NAME');
  const apiKey = envValue('CLOUDINARY_API_KEY');
  const apiSecret = envValue('CLOUDINARY_API_SECRET');

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== '' && value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
}

function attachmentStorageKeyFor(userId: Types.ObjectId, attachmentType: 'IMAGE' | 'DOCUMENT') {
  const suffix = crypto.randomBytes(8).toString('hex');
  return `vivah/messages/${userId.toString()}/${attachmentType.toLowerCase()}/${suffix}`;
}

function accessSecret() {
  return (
    process.env.MEDIA_ACCESS_SECRET ?? process.env.JWT_ACCESS_SECRET ?? 'local-media-access-secret'
  );
}

function signAccessToken(attachmentId: string, viewerId: string, expiresAt: number) {
  const payload = `${attachmentId}.${viewerId}.${expiresAt}`;
  const signature = crypto.createHmac('sha256', accessSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

function encodeCursor(value: { timestamp: string; id: string }) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeCursor(cursor?: string) {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      timestamp?: string;
      id?: string;
    };
    if (!decoded.timestamp || !decoded.id || !Types.ObjectId.isValid(decoded.id)) {
      throw new Error('Invalid cursor');
    }
    const timestamp = new Date(decoded.timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      throw new Error('Invalid cursor');
    }
    return { timestamp, id: new Types.ObjectId(decoded.id) };
  } catch {
    throw new HttpError(400, 'Invalid cursor');
  }
}

async function assertNoBlock(userId: Types.ObjectId, otherUserId: Types.ObjectId) {
  const block = await BlockModel.findOne({
    isDeleted: false,
    $or: [
      { blockerId: userId, blockedId: otherUserId },
      { blockerId: otherUserId, blockedId: userId },
    ],
  });

  if (block) {
    throw new HttpError(403, 'Messaging is blocked for this member');
  }
}

async function assertActiveProfile(userId: Types.ObjectId) {
  const profile = await ProfileModel.findOne({
    userId,
    isDeleted: false,
    userStatus: AccountStatus.ACTIVE,
    userIsDeleted: false,
    'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
    'visibility.status': { $in: [ProfileVisibility.PUBLIC, ProfileVisibility.MEMBERS_ONLY] },
  });

  if (!profile) {
    throw new HttpError(403, 'This member is currently not available for messaging');
  }
}

function otherParticipant(participantIds: Types.ObjectId[], userId: Types.ObjectId) {
  return participantIds.find((participantId) => !participantId.equals(userId));
}

async function assertAcceptedInterest(userId: Types.ObjectId, otherUserId: Types.ObjectId) {
  const interest = await InterestModel.findOne({
    status: InterestStatus.ACCEPTED,
    isDeleted: false,
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  });

  if (!interest) {
    throw new HttpError(403, 'Messaging is available after an accepted interest');
  }
}

function publicAttachmentAccessUrl(
  attachment: {
    id: string;
    assetUrl: string;
    storageKey?: string;
  },
  viewerId: Types.ObjectId,
) {
  if (!attachment.storageKey) {
    return attachment.assetUrl;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS;
  const token = signAccessToken(attachment.id, viewerId.toString(), expiresAt);
  const separator = attachment.assetUrl.includes('?') ? '&' : '?';
  return `${attachment.assetUrl}${separator}attachmentAccessToken=${token}`;
}

async function getOwnMessageAttachmentOrFail(userId: Types.ObjectId, attachmentId: string) {
  if (!Types.ObjectId.isValid(attachmentId)) {
    throw new HttpError(404, 'Attachment not found');
  }

  const attachment = await MessageAttachmentModel.findOne({
    _id: attachmentId,
    uploadedBy: userId,
    isDeleted: false,
  });

  if (!attachment) {
    throw new HttpError(404, 'Attachment not found');
  }

  return attachment;
}

export async function getConversationForUser(userId: Types.ObjectId, conversationId: string, assertWriteAllowed = true) {
  if (!Types.ObjectId.isValid(conversationId)) {
    throw new HttpError(404, 'Conversation not found');
  }

  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    participantIds: userId,
    isDeleted: false,
    deletedFor: { $ne: userId },
  });

  if (!conversation) {
    throw new HttpError(404, 'Conversation not found');
  }

  const otherUserId = otherParticipant(conversation.participantIds, userId);
  if (!otherUserId) {
    throw new HttpError(404, 'Conversation not found');
  }

  if (assertWriteAllowed) {
    await assertNoBlock(userId, otherUserId);
    await assertActiveProfile(otherUserId);
  }
  
  return conversation;
}


export async function createSignedMessageAttachmentUpload(
  userId: Types.ObjectId,
  input: MessageAttachmentSignUploadInput,
) {
  if (!ATTACHMENT_MIME_ALLOWLIST.has(input.mimeType)) {
    throw new HttpError(400, 'Unsupported attachment type');
  }

  const maxSize = input.attachmentType === 'IMAGE' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
  if (input.fileSizeBytes > maxSize) {
    throw new HttpError(400, `File size exceeds the limit of ${maxSize / (1024 * 1024)}MB`);
  }

  const storageKey = attachmentStorageKeyFor(userId, input.attachmentType);
  const cloudinary = cloudinaryConfig();
  const expiresAt = new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000);
  const attachment = await MessageAttachmentModel.create({
    uploadedBy: userId,
    attachmentType: input.attachmentType,
    assetUrl: `${LOCAL_UPLOAD_BASE_URL}/api/message-attachments/${storageKey}`,
    storageKey,
    uploadStatus: MediaUploadStatus.SIGNED,
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    uploadProvider: cloudinary ? 'cloudinary' : 'mock',
    uploadExpiresAt: expiresAt,
  });

  if (!cloudinary) {
    const timestamp = Math.floor(Date.now() / 1000);
    return {
      attachment: publicAttachment(attachment, userId),
      upload: {
        provider: 'mock',
        method: 'POST',
        url: `${LOCAL_UPLOAD_BASE_URL}/api/mock-storage/upload`,
        expiresAt: expiresAt.toISOString(),
        fields: {
          public_id: storageKey,
          timestamp: String(timestamp),
          signature: signAccessToken(
            attachment.id,
            userId.toString(),
            Math.floor(expiresAt.getTime() / 1000),
          ),
        },
      },
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = storageKey.split('/').slice(0, -1).join('/');
  const publicId = storageKey.split('/').at(-1) ?? attachment.id;
  const params = {
    folder,
    public_id: publicId,
    timestamp,
    type: 'authenticated',
    context: `attachment_id=${attachment.id}|user_id=${userId.toString()}`,
  };
  const signature = signCloudinaryParams(params, cloudinary.apiSecret);

  return {
    attachment: publicAttachment(attachment, userId),
    upload: {
      provider: 'cloudinary',
      method: 'POST',
      url: `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/auto/upload`,
      expiresAt: expiresAt.toISOString(),
      fields: {
        ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])),
        api_key: cloudinary.apiKey,
        signature,
      },
    },
  };
}

export async function completeMessageAttachmentUpload(
  userId: Types.ObjectId,
  input: MessageAttachmentCompleteUploadInput,
) {
  const attachment = await getOwnMessageAttachmentOrFail(userId, input.attachmentId);
  const cloudinary = cloudinaryConfig();

  if (attachment.uploadStatus !== MediaUploadStatus.SIGNED) {
    throw new HttpError(400, 'Attachment upload is not awaiting completion');
  }

  if (!attachment.uploadExpiresAt || attachment.uploadExpiresAt.getTime() <= Date.now()) {
    throw new HttpError(400, 'Attachment upload has expired');
  }

  if (input.storageKey && input.storageKey !== attachment.storageKey) {
    throw new HttpError(400, 'Attachment storage key does not match the signed upload');
  }

  if (input.bytes !== undefined) {
    const maxBytes = attachment.attachmentType === 'IMAGE' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
    if (input.bytes > maxBytes) {
      throw new HttpError(400, `File size exceeds the limit of ${maxBytes / (1024 * 1024)}MB`);
    }
  }

  if (!ATTACHMENT_MIME_ALLOWLIST.has(attachment.mimeType)) {
    throw new HttpError(400, 'Unsupported attachment type');
  }

  if (cloudinary) {
    if (attachment.uploadProvider !== 'cloudinary') {
      throw new HttpError(400, 'Attachment upload provider mismatch');
    }

    const expectedPublicId = String(attachment.storageKey).split('/').join('/');
    const encodedPublicId = expectedPublicId
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    const cloudinaryBase = `https://res.cloudinary.com/${cloudinary.cloudName}/`;

    if (
      !input.assetUrl.startsWith(cloudinaryBase) ||
      (!input.assetUrl.includes(`/upload/`) && !input.assetUrl.includes('/image/authenticated/')) ||
      !input.assetUrl.includes(encodedPublicId)
    ) {
      throw new HttpError(400, 'Invalid attachment asset URL');
    }
  } else {
    if (attachment.uploadProvider !== 'mock') {
      throw new HttpError(400, 'Attachment upload provider mismatch');
    }

    const expectedUrl = `${LOCAL_UPLOAD_BASE_URL}/api/mock-storage/${attachment.storageKey}`;
    if (input.assetUrl !== expectedUrl) {
      throw new HttpError(400, 'Invalid attachment asset URL');
    }
  }

  attachment.assetUrl = input.assetUrl;
  attachment.uploadStatus = MediaUploadStatus.UPLOADED;
  attachment.fileSizeBytes = input.bytes ?? attachment.fileSizeBytes;
  attachment.set('uploadExpiresAt', undefined);
  await attachment.save();

  return publicAttachment(attachment, userId);
}

async function resolveOwnedUploadedAttachments(userId: Types.ObjectId, input: MessageCreateInput) {
  if (input.attachments.length === 0) {
    return [];
  }

  const attachments = await Promise.all(
    input.attachments.map((attachment) =>
      getOwnMessageAttachmentOrFail(userId, attachment.attachmentId),
    ),
  );

  for (const attachment of attachments) {
    if (attachment.uploadStatus !== MediaUploadStatus.UPLOADED) {
      throw new HttpError(400, 'Attachment upload is not complete');
    }
  }

  return attachments;
}

export async function sendMessage(
  userId: Types.ObjectId,
  conversationId: string,
  input: MessageCreateInput,
) {
  const conversation = await getConversationForUser(userId, conversationId);
  const otherUserId = otherParticipant(conversation.participantIds, userId);

  if (!otherUserId) {
    throw new HttpError(404, 'Conversation not found');
  }

  await assertAcceptedInterest(userId, otherUserId);

  const attachments = await resolveOwnedUploadedAttachments(userId, input);
  const sentThisHour = await MessageModel.countDocuments({
    senderId: userId,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    isDeleted: false,
  });

  if (sentThisHour >= HOURLY_MESSAGE_LIMIT) {
    await recordUnusualMessageVolume(userId, sentThisHour);
    throw new HttpError(429, 'Rate limit exceeded. Please try again later.');
  }

  const message = await runInTransaction(async (session) => {
    const createdMessage = new MessageModel({
      conversationId: conversation._id,
      senderId: userId,
      ...(input.body ? { body: input.body } : {}),
      attachmentIds: attachments.map((attachment) => attachment._id),
      readBy: [userId],
      deletedFor: [],
    });
    await createdMessage.save(session ? { session } : undefined);

    const sentAt = new Date();
    await ConversationModel.updateOne(
      { _id: conversation._id },
      {
        $set: {
          lastMessageAt: sentAt,
          lastMessagePreview: input.body
            ? input.body.length > 50
              ? `${input.body.slice(0, 47)}...`
              : input.body
            : 'Sent an attachment',
          deletedFor: [],
        },
        $inc: { [`unreadCounts.${otherUserId}`]: 1 },
      },
      session ? { session } : {},
    );

    const lastNotifQuery = NotificationModel.findOne({
      userId: otherUserId,
      type: 'NEW_MESSAGE',
      isDeleted: false,
    }).sort({ createdAt: -1 });
    if (session) {
      lastNotifQuery.session(session);
    }
    const lastNotif = await lastNotifQuery;
    if (!lastNotif || Date.now() - lastNotif.createdAt.getTime() > 60 * 60 * 1000) {
      const notification = new NotificationModel({
        userId: otherUserId,
        type: 'NEW_MESSAGE',
        title: 'New message received',
        body: 'You have received a new message.',
      });
      await notification.save(session ? { session } : undefined);
    }

    return createdMessage;
  });
  await message.populate('attachmentIds');
  return publicMessage(message, userId);
}

export async function listConversations(userId: Types.ObjectId, cursor?: string, limit = 25) {
  const decodedCursor = decodeCursor(cursor);
  const filter: Record<string, unknown> = {
    participantIds: userId,
    isDeleted: false,
    deletedFor: { $ne: userId },
  };
  if (decodedCursor) {
    filter.$or = [
      { updatedAt: { $lt: decodedCursor.timestamp } },
      { updatedAt: decodedCursor.timestamp, _id: { $lt: decodedCursor.id } },
    ];
  }
  const conversations = await ConversationModel.find(filter)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit + 1);
  const hasMore = conversations.length > limit;
  const page = hasMore ? conversations.slice(0, limit) : conversations;
  const data = await Promise.all(page.map((conversation) => publicConversation(conversation, userId)));
  const tail = page.at(-1);

  return {
    data,
    nextCursor:
      hasMore && tail
        ? encodeCursor({ timestamp: tail.updatedAt.toISOString(), id: tail.id })
        : null,
  };
}

export async function listMessages(userId: Types.ObjectId, conversationId: string, limit = 50, beforeDate?: string) {
  const conversation = await getConversationForUser(userId, conversationId, true);
  const filter: any = {
    conversationId: conversation._id,
    isDeleted: false,
    deletedFor: { $ne: userId },
  };
  if (beforeDate) {
    filter.createdAt = { $lt: new Date(beforeDate) };
  }
  const messages = await MessageModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('attachmentIds');

  return messages.map((message) => publicMessage(message, userId)).reverse();
}

export async function markConversationRead(userId: Types.ObjectId, conversationId: string) {
  const conversation = await getConversationForUser(userId, conversationId, true);
  conversation.set(`unreadCounts.${userId}`, 0);
  await conversation.save();
  await MessageModel.updateMany(
    {
      conversationId: conversation._id,
      readBy: { $ne: userId },
      isDeleted: false,
    },
    { $addToSet: { readBy: userId } },
  );

  return { readAt: new Date() };
}

export async function deleteConversationForUser(userId: Types.ObjectId, conversationId: string) {
  const conversation = await getConversationForUser(userId, conversationId, false);
  await ConversationModel.updateOne({ _id: conversation._id }, { $addToSet: { deletedFor: userId } });
}

export async function deleteMessageForUser(userId: Types.ObjectId, messageId: string) {
  if (!Types.ObjectId.isValid(messageId)) {
    throw new HttpError(404, 'Message not found');
  }

  const message = await MessageModel.findOne({ _id: messageId, isDeleted: false });
  if (!message) {
    throw new HttpError(404, 'Message not found');
  }

  await getConversationForUser(userId, String(message.conversationId), false);
  await MessageModel.updateOne({ _id: message._id }, { $addToSet: { deletedFor: userId } });
}

async function publicConversation(conversation: ConversationDocument, userId: Types.ObjectId) {
  const otherUserId = otherParticipant(conversation.participantIds, userId);
  const otherProfile = otherUserId ? await profileForUser(otherUserId) : undefined;
  const otherUser = otherUserId ? await UserModel.findById(otherUserId).lean() : null;
  const otherProfilePayload =
    otherProfile && !otherProfile.isDeleted
      ? {
          id: otherProfile.id,
          firstName: otherProfile.personal.firstName,
          age: otherProfile.personal.age,
          city: otherProfile.location.city,
          occupation: otherProfile.employment.occupation,
        }
      : otherUser?.isDeleted
        ? {
            id: undefined,
            firstName: 'Deleted member',
            age: undefined,
            city: undefined,
            occupation: undefined,
            deleted: true,
          }
        : undefined;

  return {
    id: conversation.id,
    participantIds: conversation.participantIds.map(String),
    otherUserId: otherUserId ? String(otherUserId) : undefined,
    otherProfile: otherProfilePayload,
    lastMessageAt: conversation.lastMessageAt,
    lastMessagePreview: conversation.lastMessagePreview,
    unreadCount: conversation.get(`unreadCounts.${userId}`) || 0,
    updatedAt: conversation.updatedAt,
  };
}

async function profileForUser(userId: Types.ObjectId) {
  return ProfileModel.findOne({ userId, isDeleted: false });
}

function publicAttachment(
  attachment: {
    id: string;
    attachmentType: 'IMAGE' | 'DOCUMENT';
    assetUrl: string;
    storageKey?: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    uploadStatus: string;
    isDeleted?: boolean;
  },
  viewerId: Types.ObjectId,
) {
  if (attachment.isDeleted) {
    return {
      id: attachment.id,
      attachmentType: attachment.attachmentType,
      assetUrl: undefined,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      fileSizeBytes: attachment.fileSizeBytes,
      uploadStatus: 'UNAVAILABLE',
      unavailable: true,
    };
  }

  return {
    id: attachment.id,
    attachmentType: attachment.attachmentType,
    assetUrl: publicAttachmentAccessUrl(attachment, viewerId),
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    fileSizeBytes: attachment.fileSizeBytes,
    uploadStatus: attachment.uploadStatus,
  };
}

function publicMessage(message: MessageDocument, viewerId: Types.ObjectId) {
  const populated = message.toObject({ virtuals: true }) as unknown as {
    _id: Types.ObjectId;
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId;
    body?: string;
    attachmentIds?: Array<{
      _id?: Types.ObjectId;
      id?: string;
      attachmentType: 'IMAGE' | 'DOCUMENT';
      assetUrl: string;
      storageKey?: string;
      fileName: string;
      mimeType: string;
      fileSizeBytes: number;
      uploadStatus: string;
      isDeleted?: boolean;
    }>;
    readBy: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
  };

  return {
    id: String(populated._id),
    conversationId: String(populated.conversationId),
    senderId: String(populated.senderId),
    body: populated.body,
    attachments: (populated.attachmentIds ?? []).map((attachment) =>
      publicAttachment(
        {
          id: attachment.id ?? String(attachment._id),
          attachmentType: attachment.attachmentType,
          assetUrl: attachment.assetUrl,
          ...(attachment.storageKey ? { storageKey: attachment.storageKey } : {}),
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          fileSizeBytes: attachment.fileSizeBytes,
          uploadStatus: attachment.uploadStatus,
          ...(attachment.isDeleted !== undefined ? { isDeleted: attachment.isDeleted } : {}),
        },
        viewerId,
      ),
    ),
    readBy: populated.readBy.map(String),
    createdAt: populated.createdAt,
    updatedAt: populated.updatedAt,
  };
}
