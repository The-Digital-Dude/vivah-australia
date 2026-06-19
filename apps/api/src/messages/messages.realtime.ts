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
  conversationId?: string,
) {
  if (conversationId) {
    emitConversationLockedForPair(leftUserId, rightUserId, conversationId, reason);
  }
  const disconnectedLeft = disconnectMessageSocketsForUser(leftUserId, reason);
  const disconnectedRight = disconnectMessageSocketsForUser(rightUserId, reason);
  return disconnectedLeft + disconnectedRight;
}

/**
 * Emits a `conversation:locked` event to both participants of a conversation.
 * Called before socket disconnection so the frontend receives a graceful signal
 * and can immediately lock the conversation UI on both sides.
 */
export function emitConversationLockedForPair(
  leftUserId: Types.ObjectId,
  rightUserId: Types.ObjectId,
  conversationId: string,
  lockReason = 'blocked',
) {
  emitUserNotification(leftUserId, 'conversation:locked', { conversationId, lockReason });
  emitUserNotification(rightUserId, 'conversation:locked', { conversationId, lockReason });
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

export function emitUserNotification(userId: Types.ObjectId, event: string, payload: unknown) {
  if (!messageIo) {
    return;
  }
  messageIo.to(`user:${String(userId)}`).emit(event, payload);
}

export function emitToConversationRoom(conversationId: string, event: string, payload: unknown) {
  if (!messageIo) {
    return;
  }
  messageIo.to(conversationId).emit(event, payload);
}

export function resetMessageRealtimeState() {
  messageIo = null;
  socketsByUser.clear();
}
