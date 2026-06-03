import crypto from 'node:crypto';
import {
  InterestStatus,
  MediaUploadStatus,
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
  ProfileModel,
} from '../models/index.js';
import type { ConversationDocument, MessageDocument } from '../models/phase-one.models.js';

const UPLOAD_TTL_SECONDS = 10 * 60;
const ACCESS_TTL_SECONDS = 5 * 60;
const LOCAL_UPLOAD_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';

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

export async function getConversationForUser(userId: Types.ObjectId, conversationId: string) {
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

  await assertNoBlock(userId, otherUserId);
  return conversation;
}

export async function createOrGetConversation(userId: Types.ObjectId, profileId: string) {
  if (!Types.ObjectId.isValid(profileId)) {
    throw new HttpError(404, 'Profile not found');
  }

  const profile = await ProfileModel.findOne({ _id: profileId, isDeleted: false });
  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }

  if (profile.userId.equals(userId)) {
    throw new HttpError(400, 'Cannot message your own profile');
  }

  await assertNoBlock(userId, profile.userId);
  await assertAcceptedInterest(userId, profile.userId);

  const existing = await ConversationModel.findOne({
    participantIds: { $all: [userId, profile.userId] },
    isDeleted: false,
  });

  if (existing) {
    existing.deletedFor = existing.deletedFor.filter(
      (deletedUserId) => !deletedUserId.equals(userId),
    );
    await existing.save();
    return await publicConversation(existing, userId);
  }

  const conversation = await ConversationModel.create({
    participantIds: [userId, profile.userId],
    deletedFor: [],
  });
  return await publicConversation(conversation, userId);
}

export async function createSignedMessageAttachmentUpload(
  userId: Types.ObjectId,
  input: MessageAttachmentSignUploadInput,
) {
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
  attachment.assetUrl = input.assetUrl;
  if (input.storageKey) {
    attachment.storageKey = input.storageKey;
  }
  attachment.uploadStatus = MediaUploadStatus.UPLOADED;
  attachment.fileSizeBytes = input.bytes ?? attachment.fileSizeBytes;
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
  const message = await MessageModel.create({
    conversationId: conversation._id,
    senderId: userId,
    ...(input.body ? { body: input.body } : {}),
    attachmentIds: attachments.map((attachment) => attachment._id),
    readBy: [userId],
    deletedFor: [],
  });

  conversation.lastMessageAt = new Date();
  conversation.deletedFor = [];
  await conversation.save();

  const sentThisHour = await MessageModel.countDocuments({
    senderId: userId,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    isDeleted: false,
  });

  if (sentThisHour >= 50) {
    await recordUnusualMessageVolume(userId, sentThisHour);
  }

  await message.populate('attachmentIds');
  return publicMessage(message, userId);
}

export async function listConversations(userId: Types.ObjectId) {
  const conversations = await ConversationModel.find({
    participantIds: userId,
    isDeleted: false,
    deletedFor: { $ne: userId },
  }).sort({ lastMessageAt: -1, updatedAt: -1 });

  return Promise.all(conversations.map((conversation) => publicConversation(conversation, userId)));
}

export async function listMessages(userId: Types.ObjectId, conversationId: string) {
  const conversation = await getConversationForUser(userId, conversationId);
  const messages = await MessageModel.find({
    conversationId: conversation._id,
    isDeleted: false,
    deletedFor: { $ne: userId },
  })
    .sort({ createdAt: 1 })
    .populate('attachmentIds');

  return Promise.all(messages.map((message) => publicMessage(message, userId)));
}

export async function markConversationRead(userId: Types.ObjectId, conversationId: string) {
  const conversation = await getConversationForUser(userId, conversationId);
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
  const conversation = await getConversationForUser(userId, conversationId);
  conversation.deletedFor = Array.from(
    new Map([...conversation.deletedFor, userId].map((id) => [String(id), id])).values(),
  );
  await conversation.save();
}

export async function deleteMessageForUser(userId: Types.ObjectId, messageId: string) {
  if (!Types.ObjectId.isValid(messageId)) {
    throw new HttpError(404, 'Message not found');
  }

  const message = await MessageModel.findOne({ _id: messageId, isDeleted: false });
  if (!message) {
    throw new HttpError(404, 'Message not found');
  }

  await getConversationForUser(userId, String(message.conversationId));
  message.deletedFor = Array.from(
    new Map([...message.deletedFor, userId].map((id) => [String(id), id])).values(),
  );
  await message.save();
}

async function publicConversation(conversation: ConversationDocument, userId: Types.ObjectId) {
  const otherUserId = otherParticipant(conversation.participantIds, userId);
  const otherProfile = otherUserId ? await profileForUser(otherUserId) : undefined;

  return {
    id: conversation.id,
    participantIds: conversation.participantIds.map(String),
    otherUserId: otherUserId ? String(otherUserId) : undefined,
    otherProfile: otherProfile
      ? {
          id: otherProfile.id,
          firstName: otherProfile.personal.firstName,
          age: otherProfile.personal.age,
          city: otherProfile.location.city,
          occupation: otherProfile.employment.occupation,
        }
      : undefined,
    lastMessageAt: conversation.lastMessageAt,
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
  },
  viewerId: Types.ObjectId,
) {
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

async function publicMessage(message: MessageDocument, viewerId: Types.ObjectId) {
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
        },
        viewerId,
      ),
    ),
    readBy: populated.readBy.map(String),
    createdAt: populated.createdAt,
    updatedAt: populated.updatedAt,
  };
}
