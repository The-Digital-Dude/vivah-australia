import { InterestStatus, type MessageCreateInput } from '@vivah/shared';
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

async function attachmentPayloads(userId: Types.ObjectId, input: MessageCreateInput) {
  if (input.attachments.length === 0) {
    return [];
  }

  const attachments = await MessageAttachmentModel.create(
    input.attachments.map((attachment) => ({
      uploadedBy: userId,
      attachmentType: attachment.attachmentType,
      assetUrl: attachment.assetUrl,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      fileSizeBytes: attachment.fileSizeBytes,
      ...(attachment.storageKey ? { storageKey: attachment.storageKey } : {}),
    })),
  );

  return Array.isArray(attachments) ? attachments : [attachments];
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

  const attachments = await attachmentPayloads(userId, input);
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

  return publicMessage(message);
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

  return messages.map((message) => publicMessage(message));
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

function publicMessage(message: MessageDocument) {
  const populated = message.toObject({ virtuals: true }) as {
    _id: Types.ObjectId;
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId;
    body?: string;
    attachmentIds?: unknown[];
    readBy: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
  };

  return {
    id: String(populated._id),
    conversationId: String(populated.conversationId),
    senderId: String(populated.senderId),
    body: populated.body,
    attachments: populated.attachmentIds ?? [],
    readBy: populated.readBy.map(String),
    createdAt: populated.createdAt,
    updatedAt: populated.updatedAt,
  };
}
