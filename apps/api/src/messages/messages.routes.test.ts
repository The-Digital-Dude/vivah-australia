import { createServer, type Server as HttpServer } from 'node:http';
import request from 'supertest';
import type { Response } from 'supertest';
import { io as createClient, type Socket } from 'socket.io-client';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, Gender, InterestStatus, UserRole } from '@vivah/shared';
import { createApp } from '../app.js';
import { createTokenPair } from '../auth/token.service.js';
import type { AuthConfig } from '../auth/auth-types.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { attachMessageSocketServer } from './messages.socket.js';
import {
  BlockModel,
  ConversationModel,
  InterestModel,
  MessageAttachmentModel,
  MessageModel,
  ProfileApprovalStatus,
  ProfileModel,
  UserModel,
  type ProfileDocument,
  type UserDocument,
} from '../models/index.js';

const authConfig: AuthConfig = {
  accessSecret: 'test-access-secret-minimum-32-characters',
  refreshSecret: 'test-refresh-secret-minimum-32-characters',
  accessExpiresIn: '15m',
  refreshExpiresIn: '30d',
  exposeSensitiveTokens: true,
};

const app = createApp({
  corsOrigins: ['http://localhost:3000'],
  auth: authConfig,
});

let mongoServer: MongoMemoryServer;
let httpServer: HttpServer;
let socketUrl: string;

function bodyAs<TBody>(response: Response): TBody {
  return response.body as TBody;
}

async function createUploadedAttachment(
  accessToken: string,
  input: {
    attachmentType: 'IMAGE' | 'DOCUMENT';
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
  },
) {
  const signed = await request(app)
    .post('/api/me/message-attachments/sign-upload')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      attachmentType: input.attachmentType,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
    })
    .expect(201);
  const signedBody = bodyAs<{
    attachment: { id: string };
    upload: { provider: 'cloudinary' | 'mock'; fields?: { public_id?: string } };
  }>(signed);
  const attachmentId = signedBody.attachment.id;
  const storageKey = signedBody.upload.fields?.public_id;

  if (!storageKey) {
    throw new Error('Expected signed upload to include a storage key');
  }

  const completed = await request(app)
    .post('/api/me/message-attachments/complete')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      attachmentId,
      assetUrl: `http://localhost:4000/api/mock-storage/${storageKey}`,
      storageKey,
      bytes: input.fileSizeBytes,
    })
    .expect(200);

  return bodyAs<{ attachment: { id: string } }>(completed).attachment.id;
}

async function createUser(email: string): Promise<{ user: UserDocument; accessToken: string }> {
  const user: UserDocument = await UserModel.create({
    email,
    authProviders: ['email'],
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    mobileVerified: false,
    failedLoginAttempts: 0,
    refreshTokenVersion: 0,
    marketingConsent: false,
    metadata: {},
  });
  const accessToken = createTokenPair(authConfig, {
    id: user.id,
    role: user.role,
    refreshTokenVersion: 0,
  }).accessToken;

  return { user, accessToken };
}

async function createProfile(
  userId: mongoose.Types.ObjectId,
  displayId: string,
  firstName: string,
  gender: (typeof Gender)[keyof typeof Gender],
) {
  const profile: ProfileDocument = await ProfileModel.create({
    userId,
    userStatus: AccountStatus.ACTIVE,
    userIsDeleted: false,
    displayId,
    completionPercentage: 100,
    personal: {
      firstName,
      lastName: 'Member',
      gender,
      age: 30,
      dateOfBirth: new Date('1995-01-01'),
      maritalStatus: 'NEVER_MARRIED',
    },
    religion: { religion: 'Hindu', community: 'Indian', languagesSpoken: ['English'] },
    location: { country: 'Australia', state: 'VIC', city: 'Melbourne' },
    education: { highestQualification: 'Bachelor degree' },
    employment: { occupation: 'Engineer', annualIncomeVisibility: 'PRIVATE' },
    family: {},
    lifestyle: {},
    about: {
      aboutMe: `${firstName} has a complete approved test profile.`,
      partnerExpectations: 'Looking for a respectful long-term match.',
    },
    partnerPreference: {},
    verification: {
      level: 'BASIC',
      emailVerified: true,
      mobileVerified: false,
      identityVerified: false,
      addressVerified: false,
      employmentVerified: false,
      visaVerified: false,
      policeClearanceVerified: false,
      facialVerified: false,
    },
    visibility: {
      status: 'MEMBERS_ONLY',
      showPhoto: true,
      showIncome: false,
      showEmployer: false,
      showLastName: false,
    },
    stats: { profileViews: 0, interestsReceived: 0, interestsSent: 0, favouritesCount: 0 },
    moderation: { approvalStatus: ProfileApprovalStatus.APPROVED },
  });
  return profile;
}

async function createAcceptedConversation() {
  const sender = await createUser(`sender-${Date.now()}@example.com`);
  const receiver = await createUser(`receiver-${Date.now()}@example.com`);
  const senderProfile = await createProfile(
    sender.user._id,
    `VAS${Date.now()}`,
    'Amit',
    Gender.MALE,
  );
  const receiverProfile = await createProfile(
    receiver.user._id,
    `VAR${Date.now()}`,
    'Priya',
    Gender.FEMALE,
  );
  await InterestModel.create({
    senderId: sender.user._id,
    receiverId: receiver.user._id,
    status: InterestStatus.ACCEPTED,
    respondedAt: new Date(),
  });
  const conversation = await ConversationModel.create({
    participantIds: [sender.user._id, receiver.user._id],
    deletedFor: [],
  });

  return { sender, receiver, senderProfile, receiverProfile, conversation };
}

function connectSocket(token?: string) {
  return createClient(socketUrl, {
    auth: token ? { token } : {},
    transports: ['websocket'],
    reconnection: false,
    forceNew: true,
  });
}

function waitForConnect(socket: Socket) {
  return new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', (error) => reject(error));
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDatabase(mongoServer.getUri());
  httpServer = createServer(app);
  attachMessageSocketServer(httpServer, {
    corsOrigins: ['http://localhost:3000'],
    auth: authConfig,
  });
  await new Promise<void>((resolve) => {
    httpServer.listen(0, () => resolve());
  });
  const address = httpServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to bind test server');
  }
  socketUrl = `http://127.0.0.1:${address.port}`;
}, 180000);

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

afterAll(async () => {
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await disconnectDatabase();
  await mongoServer?.stop();
}, 180000);

describe('message routes and realtime server', () => {
  it('does not expose a member route to create conversations directly', async () => {
    const viewer = await createUser('viewer@example.com');
    const target = await createUser('target@example.com');
    await createProfile(viewer.user._id, 'VA400001', 'Amit', Gender.MALE);
    const targetProfile = await createProfile(target.user._id, 'VA400002', 'Priya', Gender.FEMALE);

    await request(app)
      .post('/api/me/conversations')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({ profileId: targetProfile.id })
      .expect(404);
  });

  it('sends messages with attachments, marks read, and deletes for current user', async () => {
    const { sender, receiver, conversation } = await createAcceptedConversation();
    const imageAttachmentId = await createUploadedAttachment(sender.accessToken, {
      attachmentType: 'IMAGE',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 2048,
    });
    const documentAttachmentId = await createUploadedAttachment(sender.accessToken, {
      attachmentType: 'DOCUMENT',
      fileName: 'profile.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 4096,
    });

    const response = await request(app)
      .post(`/api/me/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({
        body: 'Hello, nice to connect.',
        attachments: [
          { attachmentId: imageAttachmentId },
          { attachmentId: documentAttachmentId },
        ],
      })
      .expect(201);
    const body = bodyAs<{ data: { id: string; attachments: Array<{ assetUrl?: string }>; readBy: string[] } }>(
      response,
    );

    expect(body.data.attachments).toHaveLength(2);
    expect(body.data.attachments[0]?.assetUrl).toContain('attachmentAccessToken=');
    expect(body.data.readBy).toContain(String(sender.user._id));
    expect(await MessageAttachmentModel.countDocuments({ uploadedBy: sender.user._id })).toBe(2);

    await request(app)
      .post(`/api/me/conversations/${conversation.id}/read`)
      .set('Authorization', `Bearer ${receiver.accessToken}`)
      .expect(200);

    const message = await MessageModel.findById(body.data.id).orFail();
    expect(message.readBy.map(String)).toContain(String(receiver.user._id));

    await request(app)
      .delete(`/api/me/messages/${body.data.id}`)
      .set('Authorization', `Bearer ${receiver.accessToken}`)
      .expect(204);

    const receiverMessages = await request(app)
      .get(`/api/me/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${receiver.accessToken}`)
      .expect(200);
    expect(bodyAs<{ messages: unknown[] }>(receiverMessages).messages).toHaveLength(0);
  });

  it('requires owned uploaded attachments before a message can reference them', async () => {
    const { sender, receiver, conversation } = await createAcceptedConversation();
    const attachmentId = await createUploadedAttachment(receiver.accessToken, {
      attachmentType: 'IMAGE',
      fileName: 'not-yours.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 1024,
    });

    await request(app)
      .post(`/api/me/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({
        body: 'Trying to attach another member file.',
        attachments: [{ attachmentId }],
      })
      .expect(404);
  });

  it('blocks messaging when either participant blocks the other', async () => {
    const { sender, receiver, conversation } = await createAcceptedConversation();
    await BlockModel.create({ blockerId: receiver.user._id, blockedId: sender.user._id });

    await request(app)
      .post(`/api/me/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ body: 'Can you see this?' })
      .expect(403);
  });

  it('disconnects active chat sockets immediately after a block is created', async () => {
    const { sender, receiver, receiverProfile, conversation } = await createAcceptedConversation();
    const senderSocket = connectSocket(sender.accessToken);
    const receiverSocket = connectSocket(receiver.accessToken);

    await Promise.all([waitForConnect(senderSocket), waitForConnect(receiverSocket)]);
    await Promise.all([
      new Promise<void>((resolve) => senderSocket.emit('conversation:join', { conversationId: conversation.id }, () => resolve())),
      new Promise<void>((resolve) => receiverSocket.emit('conversation:join', { conversationId: conversation.id }, () => resolve())),
    ]);

    const senderDisconnect = new Promise<string>((resolve) =>
      senderSocket.once('system:access-revoked', (payload: unknown) =>
        resolve((payload as { reason: string }).reason),
      ),
    );
    const receiverDisconnect = new Promise<string>((resolve) =>
      receiverSocket.once('system:access-revoked', (payload: unknown) =>
        resolve((payload as { reason: string }).reason),
      ),
    );

    await request(app)
      .post('/api/me/blocks')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ profileId: receiverProfile.id })
      .expect(201);

    await expect(senderDisconnect).resolves.toBe('blocked');
    await expect(receiverDisconnect).resolves.toBe('blocked');

    senderSocket.disconnect();
    receiverSocket.disconnect();
  });

  it('authenticates sockets and delivers realtime message, typing, and read events', async () => {
    const { sender, receiver, conversation } = await createAcceptedConversation();
    const senderSocket = connectSocket(sender.accessToken);
    const receiverSocket = connectSocket(receiver.accessToken);

    await Promise.all([waitForConnect(senderSocket), waitForConnect(receiverSocket)]);

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        senderSocket.emit(
          'conversation:join',
          { conversationId: conversation.id },
          (response: unknown) => {
            const result = response as { ok: boolean; message?: string };
            if (result.ok) {
              resolve();
              return;
            }
            reject(new Error(result.message ?? 'join failed'));
          },
        );
      }),
      new Promise<void>((resolve, reject) => {
        receiverSocket.emit(
          'conversation:join',
          { conversationId: conversation.id },
          (response: unknown) => {
            const result = response as { ok: boolean; message?: string };
            if (result.ok) {
              resolve();
              return;
            }
            reject(new Error(result.message ?? 'join failed'));
          },
        );
      }),
    ]);

    const typingPromise = new Promise<unknown>((resolve) => receiverSocket.once('typing', resolve));
    senderSocket.emit('typing', { conversationId: conversation.id, typing: true });
    expect(await typingPromise).toMatchObject({ conversationId: conversation.id, typing: true });

    const messagePromise = new Promise<unknown>((resolve) =>
      receiverSocket.once('message:new', resolve),
    );
    senderSocket.emit(
      'message:send',
      { conversationId: conversation.id, message: { body: 'Realtime hello' } },
      (response: unknown) => {
        expect(response).toMatchObject({ ok: true });
      },
    );
    expect(await messagePromise).toMatchObject({ body: 'Realtime hello' });

    const readPromise = new Promise<unknown>((resolve) =>
      senderSocket.once('message:read', resolve),
    );
    receiverSocket.emit('message:read', { conversationId: conversation.id });
    expect(await readPromise).toMatchObject({
      conversationId: conversation.id,
      userId: String(receiver.user._id),
    });

    senderSocket.disconnect();
    receiverSocket.disconnect();
  });

  it('rejects socket room joins for non-participants', async () => {
    const { conversation } = await createAcceptedConversation();
    const outsider = await createUser(`outsider-${Date.now()}@example.com`);
    await createProfile(outsider.user._id, `VAO${Date.now()}`, 'Outsider', Gender.MALE);
    const outsiderSocket = connectSocket(outsider.accessToken);

    await waitForConnect(outsiderSocket);

    const joinResult = await new Promise<{ ok: boolean; message?: string }>((resolve) => {
      outsiderSocket.emit('conversation:join', { conversationId: conversation.id }, resolve);
    });

    expect(joinResult.ok).toBe(false);
    expect(joinResult.message).toContain('Conversation not found');

    outsiderSocket.disconnect();
  });

  it('blocks reading messages when the other member is no longer available', async () => {
    const { sender, conversation, receiverProfile } = await createAcceptedConversation();
    await ProfileModel.updateOne(
      { _id: receiverProfile._id },
      {
        $set: {
          userStatus: AccountStatus.SUSPENDED,
        },
      },
    );

    await request(app)
      .get(`/api/me/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .expect(403);
  });

  it('enforces the hourly message cap before persisting the 51st message', async () => {
    const { sender, conversation } = await createAcceptedConversation();

    await MessageModel.insertMany(
      Array.from({ length: 50 }, (_, index) => ({
        conversationId: conversation._id,
        senderId: sender.user._id,
        body: `Existing message ${index + 1}`,
        attachmentIds: [],
        readBy: [sender.user._id],
        deletedFor: [],
        isDeleted: false,
      })),
    );

    const beforeCount = await MessageModel.countDocuments({ senderId: sender.user._id });

    await request(app)
      .post(`/api/me/conversations/${conversation.id}/messages`)
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ body: 'This one should be blocked.' })
      .expect(429);

    const afterCount = await MessageModel.countDocuments({ senderId: sender.user._id });
    expect(afterCount).toBe(beforeCount);
  });

  it('rejects unauthenticated sockets', async () => {
    const socket = connectSocket();
    await expect(waitForConnect(socket)).rejects.toThrow();
    socket.disconnect();
  });
});
