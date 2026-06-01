import {
  communityCommentCreateSchema,
  communityPostCreateSchema,
  communityPostsQuerySchema,
  communityPostStatusUpdateSchema,
  communityPostUpdateSchema,
  communityReactionSchema,
  communityRoomInputSchema,
  communityRoomUpdateSchema,
  reportCreateSchema,
  UserRole,
} from '@vivah/shared';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { HttpError } from '../auth/auth-errors.js';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import {
  addComment,
  archiveRoom,
  createPost,
  createRoom,
  deletePost,
  getRoomBySlug,
  listComments,
  listPostsForRoom,
  listRooms,
  moderatePost,
  reportCommunityPost,
  toggleReaction,
  updatePost,
  updateRoom,
} from './community.service.js';

function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function requireRequestAuth(request: AuthenticatedRequest) {
  if (!request.auth) throw new HttpError(401, 'Authentication required');
  return request.auth;
}

function requireAdmin(request: AuthenticatedRequest) {
  const auth = requireRequestAuth(request);
  if (
    auth.role !== UserRole.SUPER_ADMIN &&
    auth.role !== UserRole.ADMIN &&
    auth.role !== UserRole.MODERATOR
  ) {
    throw new HttpError(403, 'Admin access required');
  }
  return auth;
}

export function createCommunityRouter(config: AuthConfig): Router {
  const router = Router();

  router.get(
    '/community/rooms',
    asyncHandler(async (_request, response) => {
      response.status(200).json({ rooms: await listRooms() });
    }),
  );

  router.get(
    '/community/rooms/:slug',
    asyncHandler(async (request, response) => {
      const slug = request.params.slug;
      if (!slug) throw new HttpError(404, 'Room not found');
      response.status(200).json({ room: await getRoomBySlug(slug) });
    }),
  );

  router.get(
    '/community/rooms/:roomId/posts',
    asyncHandler(async (request, response) => {
      const roomId = request.params.roomId;
      if (!roomId) throw new HttpError(404, 'Room not found');
      response
        .status(200)
        .json(await listPostsForRoom(roomId, communityPostsQuerySchema.parse(request.query)));
    }),
  );

  router.post(
    '/community/rooms/:roomId/posts',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const roomId = request.params.roomId;
      if (!roomId) throw new HttpError(404, 'Room not found');
      response.status(201).json({
        post: await createPost(auth.userId, roomId, communityPostCreateSchema.parse(request.body)),
        message: 'Post published',
      });
    }),
  );

  router.patch(
    '/community/posts/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const postId = request.params.id;
      if (!postId) throw new HttpError(404, 'Post not found');
      response.status(200).json({
        post: await updatePost(
          auth.userId,
          auth.role,
          postId,
          communityPostUpdateSchema.parse(request.body),
        ),
        message: 'Post updated',
      });
    }),
  );

  router.delete(
    '/community/posts/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const postId = request.params.id;
      if (!postId) throw new HttpError(404, 'Post not found');
      await deletePost(auth.userId, auth.role, postId);
      response.status(204).send();
    }),
  );

  router.get(
    '/community/posts/:id/comments',
    asyncHandler(async (request, response) => {
      const postId = request.params.id;
      if (!postId) throw new HttpError(404, 'Post not found');
      response.status(200).json({ comments: await listComments(postId) });
    }),
  );

  router.post(
    '/community/posts/:id/comments',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const postId = request.params.id;
      if (!postId) throw new HttpError(404, 'Post not found');
      response.status(201).json({
        comment: await addComment(
          auth.userId,
          postId,
          communityCommentCreateSchema.parse(request.body),
        ),
        message: 'Comment added',
      });
    }),
  );

  router.post(
    '/community/posts/:id/reactions',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const postId = request.params.id;
      if (!postId) throw new HttpError(404, 'Post not found');
      response.status(200).json({
        reaction: await toggleReaction(
          auth.userId,
          postId,
          communityReactionSchema.parse(request.body),
        ),
      });
    }),
  );

  router.post(
    '/community/posts/:id/report',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const postId = request.params.id;
      if (!postId) throw new HttpError(404, 'Post not found');
      const input = reportCreateSchema.pick({ reason: true }).parse(request.body);
      response.status(201).json({
        report: await reportCommunityPost(auth.userId, postId, input.reason),
        message: 'Report submitted',
      });
    }),
  );

  router.post(
    '/admin/community/rooms',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireAdmin(request);
      response.status(201).json({
        room: await createRoom(auth.userId, communityRoomInputSchema.parse(request.body)),
        message: 'Room created',
      });
    }),
  );

  router.patch(
    '/admin/community/rooms/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireAdmin(request);
      const roomId = request.params.id;
      if (!roomId) throw new HttpError(404, 'Room not found');
      response.status(200).json({
        room: await updateRoom(auth.userId, roomId, communityRoomUpdateSchema.parse(request.body)),
        message: 'Room updated',
      });
    }),
  );

  router.delete(
    '/admin/community/rooms/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireAdmin(request);
      const roomId = request.params.id;
      if (!roomId) throw new HttpError(404, 'Room not found');
      await archiveRoom(auth.userId, roomId);
      response.status(204).send();
    }),
  );

  router.patch(
    '/admin/community/posts/:id/status',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireAdmin(request);
      const postId = request.params.id;
      if (!postId) throw new HttpError(404, 'Post not found');
      response.status(200).json({
        post: await moderatePost(
          auth.userId,
          postId,
          communityPostStatusUpdateSchema.parse(request.body),
        ),
        message: 'Post moderated',
      });
    }),
  );

  return router;
}
