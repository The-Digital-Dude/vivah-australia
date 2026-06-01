import { conversationCreateSchema, messageCreateSchema } from '@vivah/shared';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { HttpError } from '../auth/auth-errors.js';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import {
  createOrGetConversation,
  deleteConversationForUser,
  deleteMessageForUser,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from './messages.service.js';

function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function requireRequestAuth(request: AuthenticatedRequest) {
  if (!request.auth) {
    throw new HttpError(401, 'Authentication required');
  }

  return request.auth;
}

export function createMessagesRouter(config: AuthConfig): Router {
  const router = Router();

  router.get(
    '/me/conversations',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const conversations = await listConversations(auth.userId);
      response.status(200).json({ conversations });
    }),
  );

  router.post(
    '/me/conversations',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = conversationCreateSchema.parse(request.body);
      const conversation = await createOrGetConversation(auth.userId, input.profileId);
      response.status(201).json({ conversation });
    }),
  );

  router.delete(
    '/me/conversations/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const conversationId = request.params.id;

      if (!conversationId) {
        throw new HttpError(404, 'Conversation not found');
      }

      await deleteConversationForUser(auth.userId, conversationId);
      response.status(204).send();
    }),
  );

  router.get(
    '/me/conversations/:id/messages',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const conversationId = request.params.id;

      if (!conversationId) {
        throw new HttpError(404, 'Conversation not found');
      }

      const messages = await listMessages(auth.userId, conversationId);
      response.status(200).json({ messages });
    }),
  );

  router.post(
    '/me/conversations/:id/messages',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const conversationId = request.params.id;

      if (!conversationId) {
        throw new HttpError(404, 'Conversation not found');
      }

      const input = messageCreateSchema.parse(request.body);
      const message = await sendMessage(auth.userId, conversationId, input);
      response.status(201).json({ message });
    }),
  );

  router.post(
    '/me/conversations/:id/read',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const conversationId = request.params.id;

      if (!conversationId) {
        throw new HttpError(404, 'Conversation not found');
      }

      const read = await markConversationRead(auth.userId, conversationId);
      response.status(200).json({ read });
    }),
  );

  router.delete(
    '/me/messages/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const messageId = request.params.id;

      if (!messageId) {
        throw new HttpError(404, 'Message not found');
      }

      await deleteMessageForUser(auth.userId, messageId);
      response.status(204).send();
    }),
  );

  return router;
}
