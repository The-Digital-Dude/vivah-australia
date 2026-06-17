'use client';

export interface RealtimeNotificationItem {
  _id?: string;
  userId?: string;
  type: string;
  title: string;
  body?: string;
  data?: unknown;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type NotificationRealtimeEvent =
  | { type: 'notification:new'; notification: RealtimeNotificationItem }
  | { type: 'notification:updated'; notification: RealtimeNotificationItem }
  | { type: 'notification:deleted'; notificationId: string }
  | { type: 'notification:all-read'; readAt: string }
  | { type: 'notification:unread-count'; unreadCount: number };

const NOTIFICATION_SYNC_EVENT = 'vivah:notification-sync';

export function dispatchNotificationRealtimeEvent(detail: NotificationRealtimeEvent) {
  window.dispatchEvent(new CustomEvent<NotificationRealtimeEvent>(NOTIFICATION_SYNC_EVENT, { detail }));
}

export function subscribeToNotificationRealtimeEvents(
  handler: (event: NotificationRealtimeEvent) => void,
) {
  const listener: EventListener = (event) => {
    const customEvent = event as CustomEvent<NotificationRealtimeEvent>;
    handler(customEvent.detail);
  };

  window.addEventListener(NOTIFICATION_SYNC_EVENT, listener);

  return () => {
    window.removeEventListener(NOTIFICATION_SYNC_EVENT, listener);
  };
}
