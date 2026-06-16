import {
  conversationCreateSchema,
  messageAttachmentCompleteUploadSchema,
  messageAttachmentSignUploadSchema,
  messageCreateSchema,
} from '@vivah/shared';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { HttpError } from '../auth/auth-errors.js';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { rateLimit } from 'express-rate-limit';
import {
  createSignedMessageAttachmentUpload,
  deleteConversationForUser,
  deleteMessageForUser,
  completeMessageAttachmentUpload,
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

  router.post(
    '/me/message-attachments/sign-upload',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = messageAttachmentSignUploadSchema.parse(request.body);
      const signed = await createSignedMessageAttachmentUpload(auth.userId, input);
      response.status(201).json(signed);
    }),
  );

  router.post(
    '/me/message-attachments/complete',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = messageAttachmentCompleteUploadSchema.parse(request.body);
      const attachment = await completeMessageAttachmentUpload(auth.userId, input);
      response.status(200).json({ attachment, message: 'Attachment upload completed' });
    }),
  );

  router.get(
    '/me/conversations',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const conversations = await listConversations(auth.userId);
      response.status(200).json({ conversations });
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

      const limit = request.query.limit ? parseInt(String(request.query.limit), 10) : 50;
      const beforeDate = typeof request.query.beforeDate === 'string' ? request.query.beforeDate : undefined;

      const messages = await listMessages(auth.userId, conversationId, limit, beforeDate);
      response.status(200).json({ messages });
    }),
  );

  const messageRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { message: 'Too many requests. Please try again later.' },
  });

  router.post(
    '/me/conversations/:id/messages',
    requireAuth(config),
    messageRateLimit,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const conversationId = request.params.id;

      if (!conversationId) {
        throw new HttpError(404, 'Conversation not found');
      }

      const input = messageCreateSchema.parse(request.body);
      const message = await sendMessage(auth.userId, conversationId, input);
      response.status(201).json({ message: 'Message sent successfully', data: message });
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
