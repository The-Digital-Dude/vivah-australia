import type { Server as HttpServer } from 'node:http';
import { typingEventSchema, messageCreateSchema } from '@vivah/shared';
import { Server } from 'socket.io';
import { Types } from 'mongoose';
import type { AuthConfig } from '../auth/auth-types.js';
import { verifyAccessToken } from '../auth/token.service.js';
import { getConversationForUser, markConversationRead, sendMessage } from './messages.service.js';

interface SocketData {
  userId: Types.ObjectId;
}

export function attachMessageSocketServer(
  httpServer: HttpServer,
  options: { corsOrigins: string[]; auth: AuthConfig },
) {
  const io = new Server<
    Record<string, (...args: unknown[]) => void>,
    Record<string, (...args: unknown[]) => void>,
    Record<string, unknown>,
    SocketData
  >(httpServer, {
    cors: {
      origin: options.corsOrigins,
    },
  });

  io.use((socket, next) => {
    const token =
      typeof socket.handshake.auth.token === 'string'
        ? socket.handshake.auth.token
        : socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice('Bearer '.length)
          : undefined;

    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    try {
      const payload = verifyAccessToken(options.auth, token);
      socket.data.userId = new Types.ObjectId(payload.sub);
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error('Invalid access token'));
    }
  });

  io.on('connection', (socket) => {
    void socket.join(`user:${String(socket.data.userId)}`);

    socket.on('conversation:join', (...args: unknown[]) => {
      void (async () => {
        const [payload, ack] = args;
        const acknowledge =
          typeof ack === 'function' ? (ack as (response: unknown) => void) : undefined;
        try {
          const input = typingEventSchema.pick({ conversationId: true }).parse(payload);
          await getConversationForUser(socket.data.userId, input.conversationId);
          await socket.join(input.conversationId);
          acknowledge?.({ ok: true });
        } catch (error) {
          acknowledge?.({
            ok: false,
            message: error instanceof Error ? error.message : 'Join failed',
          });
        }
      })();
    });

    socket.on('typing', async (payload: unknown) => {
      const input = typingEventSchema.parse(payload);
      await getConversationForUser(socket.data.userId, input.conversationId);
      socket.to(input.conversationId).emit('typing', {
        conversationId: input.conversationId,
        userId: String(socket.data.userId),
        typing: input.typing,
      });
    });

    socket.on('message:send', (...args: unknown[]) => {
      void (async () => {
        const [payload, ack] = args;
        const acknowledge =
          typeof ack === 'function' ? (ack as (response: unknown) => void) : undefined;
        try {
          const envelope = payload as { conversationId?: unknown; message?: unknown };
          const conversationId =
            typeof envelope.conversationId === 'string' ? envelope.conversationId : '';
          const input = messageCreateSchema.parse(envelope.message);
          const message = await sendMessage(socket.data.userId, conversationId, input);
          io.to(conversationId).emit('message:new', message);
          io.to(conversationId).emit('conversation:updated', {
            conversationId,
            lastMessageAt: message.createdAt,
          });
          acknowledge?.({ ok: true, message });
        } catch (error) {
          acknowledge?.({
            ok: false,
            message: error instanceof Error ? error.message : 'Message failed',
          });
        }
      })();
    });

    socket.on('message:read', (...args: unknown[]) => {
      void (async () => {
        const [payload, ack] = args;
        const acknowledge =
          typeof ack === 'function' ? (ack as (response: unknown) => void) : undefined;
        try {
          const input = typingEventSchema.pick({ conversationId: true }).parse(payload);
          const read = await markConversationRead(socket.data.userId, input.conversationId);
          io.to(input.conversationId).emit('message:read', {
            conversationId: input.conversationId,
            userId: String(socket.data.userId),
            readAt: read.readAt,
          });
          acknowledge?.({ ok: true });
        } catch (error) {
          acknowledge?.({
            ok: false,
            message: error instanceof Error ? error.message : 'Read receipt failed',
          });
        }
      })();
    });
  });

  return io;
}
