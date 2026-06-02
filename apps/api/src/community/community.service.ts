import {
  CommunityPostStatus,
  ReportStatus,
  type CommunityCommentCreateInput,
  type CommunityPostCreateInput,
  type CommunityPostStatusUpdateInput,
  type CommunityPostUpdateInput,
  type CommunityPostsQueryInput,
  type CommunityReactionInput,
  type CommunityRoomInput,
  type CommunityRoomUpdateInput,
} from '@vivah/shared';
import { Types } from 'mongoose';
import { HttpError } from '../auth/auth-errors.js';
import { logAudit } from '../common/audit.service.js';
import {
  CommunityCommentModel,
  CommunityPostModel,
  CommunityReactionModel,
  CommunityRoomModel,
  ReportModel,
} from '../models/index.js';

const defaultRooms: CommunityRoomInput[] = [
  {
    slug: 'introductions',
    name: 'Introductions',
    description: 'Welcome new members and share respectful introductions.',
    isDefault: true,
  },
  {
    slug: 'wedding-planning',
    name: 'Wedding Planning',
    description: 'Discuss venues, vendors, ceremonies, and family planning.',
    isDefault: true,
  },
  {
    slug: 'australia-settlement',
    name: 'Australia Settlement',
    description: 'Share practical guidance about life, careers, and family in Australia.',
    isDefault: true,
  },
];

function toId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new HttpError(404, 'Resource not found');
  return new Types.ObjectId(id);
}

export async function ensureDefaultRooms() {
  await Promise.all(
    defaultRooms.map((room) =>
      CommunityRoomModel.updateOne({ slug: room.slug }, { $setOnInsert: room }, { upsert: true }),
    ),
  );
}

export async function listRooms() {
  await ensureDefaultRooms();
  const rooms = await CommunityRoomModel.find({ isDeleted: false }).sort({
    isDefault: -1,
    name: 1,
  });
  const counts = await CommunityPostModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { isDeleted: false, status: CommunityPostStatus.PUBLISHED } },
    { $group: { _id: '$roomId', count: { $sum: 1 } } },
  ]);
  const countByRoom = new Map(counts.map((item) => [String(item._id), item.count]));
  return rooms.map((room) => ({
    id: room.id,
    slug: room.slug,
    name: room.name,
    description: room.description,
    isDefault: room.isDefault,
    postCount: countByRoom.get(String(room._id)) ?? 0,
  }));
}

export async function getRoomBySlug(slug: string) {
  await ensureDefaultRooms();
  const room = await CommunityRoomModel.findOne({ slug, isDeleted: false });
  if (!room) throw new HttpError(404, 'Room not found');
  return room;
}

export async function createRoom(actorId: Types.ObjectId, input: CommunityRoomInput) {
  const room = await CommunityRoomModel.create({
    slug: input.slug,
    name: input.name,
    isDefault: input.isDefault,
    ...(input.description ? { description: input.description } : {}),
  });
  await logAudit({
    actorId,
    action: 'COMMUNITY_ROOM_CREATED',
    targetType: 'COMMUNITY_ROOM',
    targetId: room._id,
    metadata: { slug: room.slug },
  });
  return room;
}

export async function updateRoom(
  actorId: Types.ObjectId,
  roomId: string,
  input: CommunityRoomUpdateInput,
) {
  const room = await CommunityRoomModel.findOneAndUpdate(
    { _id: toId(roomId), isDeleted: false },
    { $set: input },
    { returnDocument: 'after' },
  );
  if (!room) throw new HttpError(404, 'Room not found');
  await logAudit({
    actorId,
    action: 'COMMUNITY_ROOM_UPDATED',
    targetType: 'COMMUNITY_ROOM',
    targetId: room._id,
    metadata: input,
  });
  return room;
}

export async function archiveRoom(actorId: Types.ObjectId, roomId: string) {
  const room = await CommunityRoomModel.findOne({ _id: toId(roomId), isDeleted: false });
  if (!room) throw new HttpError(404, 'Room not found');
  room.isDeleted = true;
  room.deletedAt = new Date();
  room.deletedBy = actorId;
  await room.save();
  await logAudit({
    actorId,
    action: 'COMMUNITY_ROOM_ARCHIVED',
    targetType: 'COMMUNITY_ROOM',
    targetId: room._id,
    metadata: { slug: room.slug },
  });
}

export async function listPostsForRoom(slugOrId: string, input: CommunityPostsQueryInput) {
  const room = Types.ObjectId.isValid(slugOrId)
    ? await CommunityRoomModel.findOne({ _id: slugOrId, isDeleted: false })
    : await getRoomBySlug(slugOrId);
  if (!room) throw new HttpError(404, 'Room not found');
  const skip = (input.page - 1) * input.pageSize;
  const filter = {
    roomId: room._id,
    isDeleted: false,
    status: CommunityPostStatus.PUBLISHED,
  };
  const [posts, total] = await Promise.all([
    CommunityPostModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.pageSize).lean(),
    CommunityPostModel.countDocuments(filter),
  ]);
  const postIds = posts.map((post) => post._id);
  const [commentCounts, reactions] = await Promise.all([
    CommunityCommentModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { postId: { $in: postIds }, isDeleted: false } },
      { $group: { _id: '$postId', count: { $sum: 1 } } },
    ]),
    CommunityReactionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { targetType: 'POST', targetId: { $in: postIds }, isDeleted: false } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
    ]),
  ]);
  const commentsByPost = new Map(commentCounts.map((item) => [String(item._id), item.count]));
  const reactionsByPost = new Map(reactions.map((item) => [String(item._id), item.count]));
  return {
    room: {
      id: room.id,
      slug: room.slug,
      name: room.name,
      description: room.description,
    },
    posts: posts.map((post) => ({
      ...post,
      id: String(post._id),
      commentCount: commentsByPost.get(String(post._id)) ?? 0,
      reactionCount: reactionsByPost.get(String(post._id)) ?? 0,
    })),
    pagination: { page: input.page, pageSize: input.pageSize, total },
  };
}

export async function createPost(
  userId: Types.ObjectId,
  roomId: string,
  input: CommunityPostCreateInput,
) {
  const room = await CommunityRoomModel.findOne({ _id: toId(roomId), isDeleted: false });
  if (!room) throw new HttpError(404, 'Room not found');
  const post = await CommunityPostModel.create({
    roomId: room._id,
    authorId: userId,
    body: input.body,
    status: CommunityPostStatus.PUBLISHED,
    ...(input.title ? { title: input.title } : {}),
  });
  return post;
}

export async function updatePost(
  userId: Types.ObjectId,
  role: string,
  postId: string,
  input: CommunityPostUpdateInput,
) {
  const post = await CommunityPostModel.findOne({ _id: toId(postId), isDeleted: false });
  if (!post) throw new HttpError(404, 'Post not found');
  if (
    String(post.authorId) !== String(userId) &&
    !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)
  ) {
    throw new HttpError(403, 'You cannot edit this post');
  }
  post.set(input);
  await post.save();
  return post;
}

export async function deletePost(userId: Types.ObjectId, role: string, postId: string) {
  const post = await CommunityPostModel.findOne({ _id: toId(postId), isDeleted: false });
  if (!post) throw new HttpError(404, 'Post not found');
  if (
    String(post.authorId) !== String(userId) &&
    !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)
  ) {
    throw new HttpError(403, 'You cannot delete this post');
  }
  post.isDeleted = true;
  post.deletedAt = new Date();
  post.deletedBy = userId;
  await post.save();
}

export async function addComment(
  userId: Types.ObjectId,
  postId: string,
  input: CommunityCommentCreateInput,
) {
  const post = await CommunityPostModel.findOne({
    _id: toId(postId),
    isDeleted: false,
    status: CommunityPostStatus.PUBLISHED,
  });
  if (!post) throw new HttpError(404, 'Post not found');
  return CommunityCommentModel.create({ postId: post._id, authorId: userId, body: input.body });
}

export async function listComments(postId: string) {
  return CommunityCommentModel.find({ postId: toId(postId), isDeleted: false })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();
}

export async function toggleReaction(
  userId: Types.ObjectId,
  postId: string,
  input: CommunityReactionInput,
) {
  const targetId = toId(postId);
  const existing = await CommunityReactionModel.findOne({
    targetType: 'POST',
    targetId,
    userId,
    reaction: input.reaction,
    isDeleted: false,
  });
  if (existing) {
    existing.isDeleted = true;
    existing.deletedAt = new Date();
    existing.deletedBy = userId;
    await existing.save();
    return { active: false };
  }
  await CommunityReactionModel.create({
    targetType: 'POST',
    targetId,
    userId,
    reaction: input.reaction,
  });
  return { active: true };
}

export async function reportCommunityPost(userId: Types.ObjectId, postId: string, reason: string) {
  const post = await CommunityPostModel.findOne({ _id: toId(postId), isDeleted: false });
  if (!post) throw new HttpError(404, 'Post not found');
  return ReportModel.create({
    reporterId: userId,
    reportedUserId: post.authorId,
    targetType: 'POST',
    targetId: post._id,
    reason,
    status: ReportStatus.OPEN,
    severity: 'MEDIUM',
  });
}

export async function moderatePost(
  actorId: Types.ObjectId,
  postId: string,
  input: CommunityPostStatusUpdateInput,
) {
  const post = await CommunityPostModel.findOne({ _id: toId(postId), isDeleted: false });
  if (!post) throw new HttpError(404, 'Post not found');
  post.status = input.status;
  await post.save();
  await logAudit({
    actorId,
    action: 'COMMUNITY_POST_MODERATED',
    targetType: 'COMMUNITY_POST',
    targetId: post._id,
    metadata: { status: input.status, reason: input.reason },
  });
  return post;
}
