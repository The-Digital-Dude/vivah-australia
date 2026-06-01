import request from 'supertest';
import type { Response } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, CommunityPostStatus, UserRole } from '@vivah/shared';
import { createApp } from '../app.js';
import type { AuthConfig } from '../auth/auth-types.js';
import { createTokenPair } from '../auth/token.service.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  AuditLogModel,
  CommunityPostModel,
  CommunityReactionModel,
  CommunityRoomModel,
  ReportModel,
  UserModel,
} from '../models/index.js';

const authConfig: AuthConfig = {
  accessSecret: 'test-access-secret-minimum-32-characters',
  refreshSecret: 'test-refresh-secret-minimum-32-characters',
  accessExpiresIn: '15m',
  refreshExpiresIn: '30d',
  exposeSensitiveTokens: true,
};

const app = createApp({ corsOrigins: ['http://localhost:3000'], auth: authConfig });
let mongoServer: MongoMemoryServer;

function bodyAs<T>(response: Response): T {
  return response.body as T;
}

async function createUser(email: string, role = UserRole.USER) {
  const user = await UserModel.create({
    email,
    authProviders: ['email'],
    role,
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
    refreshTokenVersion: user.refreshTokenVersion,
  }).accessToken;
  return { user, accessToken };
}

async function createUserWithStatus(email: string, status: AccountStatus) {
  const created = await createUser(email);
  created.user.status = status;
  await created.user.save();
  return created;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDatabase(mongoServer.getUri());
}, 180000);

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer?.stop();
});

describe('community routes', () => {
  it('creates default rooms and lets admins manage rooms', async () => {
    const admin = await createUser('community-admin@example.com', UserRole.ADMIN);

    const roomsResponse = await request(app).get('/api/community/rooms').expect(200);
    expect(bodyAs<{ rooms: Array<{ slug: string }> }>(roomsResponse).rooms.length).toBeGreaterThan(
      0,
    );

    const createResponse = await request(app)
      .post('/api/admin/community/rooms')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        slug: 'parents-corner',
        name: 'Parents Corner',
        description: 'Family moderated discussions.',
      })
      .expect(201);

    const roomId = bodyAs<{ room: { _id: string } }>(createResponse).room._id;

    await request(app)
      .patch(`/api/admin/community/rooms/${roomId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Parents Forum' })
      .expect(200);

    expect((await CommunityRoomModel.findById(roomId).orFail()).name).toBe('Parents Forum');
    expect(await AuditLogModel.countDocuments({ action: 'COMMUNITY_ROOM_UPDATED' })).toBe(1);

    await request(app)
      .delete(`/api/admin/community/rooms/${roomId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204);

    const archived = await CommunityRoomModel.findById(roomId).orFail();
    expect(archived.isDeleted).toBe(true);
    expect(archived.deletedBy?.equals(admin.user._id)).toBe(true);
    expect(await AuditLogModel.countDocuments({ action: 'COMMUNITY_ROOM_ARCHIVED' })).toBe(1);

    const listedAfterArchive = await request(app).get('/api/community/rooms').expect(200);
    expect(
      bodyAs<{ rooms: Array<{ slug: string }> }>(listedAfterArchive).rooms.some(
        (room) => room.slug === 'parents-corner',
      ),
    ).toBe(false);
  });

  it('supports posts, comments, reactions, reports, and moderation', async () => {
    const member = await createUser('community-member@example.com');
    const admin = await createUser('community-mod@example.com', UserRole.MODERATOR);
    const room = await CommunityRoomModel.create({
      slug: 'introductions',
      name: 'Introductions',
      isDefault: true,
    });

    const createPostResponse = await request(app)
      .post(`/api/community/rooms/${room.id}/posts`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ title: 'Hello community', body: 'Happy to meet other members here.' })
      .expect(201);

    const postId = bodyAs<{ post: { _id: string } }>(createPostResponse).post._id;

    await request(app)
      .post(`/api/community/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ body: 'Welcome everyone.' })
      .expect(201);

    await request(app)
      .post(`/api/community/posts/${postId}/reactions`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ reaction: 'LIKE' })
      .expect(200);

    const postsResponse = await request(app)
      .get('/api/community/rooms/introductions/posts')
      .expect(200);
    expect(
      bodyAs<{ posts: Array<{ commentCount: number; reactionCount: number }> }>(postsResponse)
        .posts[0],
    ).toMatchObject({
      commentCount: 1,
      reactionCount: 1,
    });

    await request(app)
      .post(`/api/community/posts/${postId}/report`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ reason: 'This post needs moderator review.' })
      .expect(201);
    expect(await ReportModel.countDocuments({ targetType: 'POST' })).toBe(1);

    const reportQueueResponse = await request(app)
      .get('/api/admin/reports?status=OPEN')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(
      bodyAs<{ reports: Array<{ targetType: string; targetId: string }> }>(reportQueueResponse)
        .reports[0],
    ).toMatchObject({ targetType: 'POST', targetId: postId });

    await request(app)
      .patch(`/api/admin/community/posts/${postId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: CommunityPostStatus.HIDDEN, reason: 'Review required' })
      .expect(200);

    expect((await CommunityPostModel.findById(postId).orFail()).status).toBe(
      CommunityPostStatus.HIDDEN,
    );
    expect(
      await CommunityReactionModel.countDocuments({ targetId: postId, isDeleted: false }),
    ).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'COMMUNITY_POST_MODERATED' })).toBe(1);

    await request(app)
      .delete(`/api/community/posts/${postId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204);
    const removedPost = await CommunityPostModel.findById(postId).orFail();
    expect(removedPost.isDeleted).toBe(true);
    expect(removedPost.deletedBy?.equals(admin.user._id)).toBe(true);
  });

  it('prevents banned users from posting', async () => {
    const banned = await createUserWithStatus('banned-community@example.com', AccountStatus.BANNED);
    const room = await CommunityRoomModel.create({
      slug: 'support',
      name: 'Support',
      isDefault: true,
    });

    await request(app)
      .post(`/api/community/rooms/${room.id}/posts`)
      .set('Authorization', `Bearer ${banned.accessToken}`)
      .send({ body: 'This should not publish.' })
      .expect(403);
  });
});
