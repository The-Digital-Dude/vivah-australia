import type { Socket, Server } from 'socket.io';
import type { Types } from 'mongoose';

type MessageSocket = Socket<Record<string, (...args: unknown[]) => void>, Record<string, (...args: unknown[]) => void>>;

let messageIo:
  | Server<
      Record<string, (...args: unknown[]) => void>,
      Record<string, (...args: unknown[]) => void>,
      Record<string, unknown>,
      { userId: Types.ObjectId }
    >
  | null = null;

const socketsByUser = new Map<string, Set<MessageSocket>>();

export function registerMessageIo(
  io: Server<
    Record<string, (...args: unknown[]) => void>,
    Record<string, (...args: unknown[]) => void>,
    Record<string, unknown>,
    { userId: Types.ObjectId }
  >,
) {
  messageIo = io;
}

export function trackMessageSocket(userId: Types.ObjectId, socket: MessageSocket) {
  const key = String(userId);
  const sockets = socketsByUser.get(key) ?? new Set<MessageSocket>();
  sockets.add(socket);
  socketsByUser.set(key, sockets);
}

export function untrackMessageSocket(userId: Types.ObjectId, socket: MessageSocket) {
  const key = String(userId);
  const sockets = socketsByUser.get(key);
  if (!sockets) {
    return;
  }
  sockets.delete(socket);
  if (sockets.size === 0) {
    socketsByUser.delete(key);
  }
}

export function disconnectMessageSocketsForUser(userId: Types.ObjectId, reason = 'access_revoked') {
  const sockets = socketsByUser.get(String(userId));
  if (!sockets) {
    return 0;
  }
  for (const socket of sockets) {
    socket.emit('system:access-revoked', { reason });
    socket.disconnect(true);
  }
  socketsByUser.delete(String(userId));
  return sockets.size;
}

export function disconnectMessageSocketsForPair(
  leftUserId: Types.ObjectId,
  rightUserId: Types.ObjectId,
  reason = 'blocked',
) {
  const disconnectedLeft = disconnectMessageSocketsForUser(leftUserId, reason);
  const disconnectedRight = disconnectMessageSocketsForUser(rightUserId, reason);
  return disconnectedLeft + disconnectedRight;
}

export function emitConversationAccessRevoked(userId: Types.ObjectId, conversationId: string, reason = 'blocked') {
  if (!messageIo) {
    return;
  }
  messageIo.to(`user:${String(userId)}`).emit('conversation:access-revoked', {
    conversationId,
    reason,
  });
}
