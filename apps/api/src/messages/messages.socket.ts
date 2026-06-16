import type { Server as HttpServer } from 'node:http';
import { typingEventSchema, messageCreateSchema } from '@vivah/shared';
import { Server } from 'socket.io';
import { Types } from 'mongoose';
import type { AuthConfig } from '../auth/auth-types.js';
import { verifyAccessToken } from '../auth/token.service.js';
import { AccountStatus } from '@vivah/shared';
import { UserModel } from '../models/index.js';
import { getConversationForUser, markConversationRead, sendMessage } from './messages.service.js';
import {
  registerMessageIo,
  trackMessageSocket,
  untrackMessageSocket,
} from './messages.realtime.js';

interface SocketData {
  userId: Types.ObjectId;
}

const TYPING_EVENT_THROTTLE_MS = 750;

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
    void (async () => {
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
        const userId = new Types.ObjectId(payload.sub);
        const user = await UserModel.findOne({
          _id: userId,
          isDeleted: false,
          status: AccountStatus.ACTIVE,
        });

        if (!user) {
          next(new Error('Your account is not available for messaging'));
          return;
        }

        socket.data.userId = userId;
        next();
      } catch (error) {
        next(error instanceof Error ? error : new Error('Invalid access token'));
      }
    })();
  });

  registerMessageIo(io);

  io.on('connection', (socket) => {
    const joinedConversations = new Set<string>();
    const lastTypingEventAt = new Map<string, number>();

    void socket.join(`user:${String(socket.data.userId)}`);
    trackMessageSocket(socket.data.userId, socket);

    socket.on('conversation:join', (...args: unknown[]) => {
      void (async () => {
        const [payload, ack] = args;
        const acknowledge =
          typeof ack === 'function' ? (ack as (response: unknown) => void) : undefined;
        try {
          const input = typingEventSchema.pick({ conversationId: true }).parse(payload);
          await getConversationForUser(socket.data.userId, input.conversationId);
          await socket.join(input.conversationId);
          joinedConversations.add(input.conversationId);
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
      const throttleKey = `${input.conversationId}:${input.typing ? 'typing' : 'clear'}`;
      const now = Date.now();
      const lastEvent = lastTypingEventAt.get(throttleKey) ?? 0;

      if (now - lastEvent < TYPING_EVENT_THROTTLE_MS) {
        return;
      }

      lastTypingEventAt.set(throttleKey, now);
      joinedConversations.add(input.conversationId);
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

    socket.on('disconnect', () => {
      for (const conversationId of joinedConversations) {
        socket.to(conversationId).emit('typing', {
          conversationId,
          userId: String(socket.data.userId),
          typing: false,
        });
      }
      joinedConversations.clear();
      lastTypingEventAt.clear();
      untrackMessageSocket(socket.data.userId, socket);
    });
  });

  return io;
}
