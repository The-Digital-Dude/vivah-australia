'use client';

import { useEffect, useState } from 'react';
import { useMemberRequest } from '@/lib/member-api';
import {
  subscribeToNotificationRealtimeEvents,
  type RealtimeNotificationItem,
} from '@/lib/notification-realtime';

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export function toNotificationItem(notification: RealtimeNotificationItem): NotificationItem | null {
  if (!notification._id) {
    return null;
  }

  return {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    ...(notification.body ? { body: notification.body } : {}),
    ...(notification.data ? { data: notification.data } : {}),
    ...(notification.readAt ? { readAt: notification.readAt } : {}),
    createdAt: notification.createdAt,
    ...(notification.updatedAt ? { updatedAt: notification.updatedAt } : {}),
  };
}

export function getNotificationUrl(notification: NotificationItem): string {
  switch (notification.type) {
    case 'PROFILE_VIEWED':
      return notification.data?.viewerId ? `/profiles/${String(notification.data.viewerId)}` : '/member/notifications';
    case 'INTEREST_RECEIVED':
      return '/member/activity';
    case 'INTEREST_ACCEPTED':
      return '/member/messages';
    case 'MATCH_SCORE_READY':
      return '/member/matches';
    case 'VERIFICATION_APPROVED':
    case 'VERIFICATION_REJECTED':
      return '/member/settings';
    default:
      return '/member/notifications';
  }
}

export function useNotifications() {
  const memberRequest = useMemberRequest();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  async function load() {
    const result = await memberRequest('/api/me/notifications');
    if (result.ok) {
      setNotifications((result.data as { notifications?: NotificationItem[] }).notifications ?? []);
    } else {
      setMessage(result.message);
      setIsSuccess(false);
    }
  }

  async function markRead(id: string) {
    const result = await memberRequest(`/api/me/notifications/${id}/read`, { method: 'PATCH' });
    if (result.ok) {
      await load();
    }
    return result;
  }

  async function markAllRead() {
    const result = await memberRequest('/api/me/notifications/read-all', { method: 'PATCH' });
    setMessage(result.ok ? 'All notifications marked as read.' : result.message);
    setIsSuccess(result.ok);
    if (result.ok) {
      await load();
    }
    return result;
  }

  async function remove(id: string) {
    const result = await memberRequest(`/api/me/notifications/${id}`, { method: 'DELETE' });
    setMessage(result.ok ? 'Notification deleted successfully.' : result.message);
    setIsSuccess(result.ok);
    if (result.ok) {
      await load();
    }
    return result;
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    return subscribeToNotificationRealtimeEvents((event) => {
      if (event.type === 'notification:new') {
        const notification = toNotificationItem(event.notification);
        if (!notification) {
          return;
        }
        setNotifications((current) => {
          if (current.some((item) => item._id === notification._id)) {
            return current;
          }
          return [notification, ...current];
        });
        return;
      }

      if (event.type === 'notification:updated') {
        const notification = toNotificationItem(event.notification);
        if (!notification) {
          return;
        }
        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id ? { ...item, ...notification } : item,
          ),
        );
        return;
      }

      if (event.type === 'notification:deleted') {
        setNotifications((current) =>
          current.filter((item) => item._id !== event.notificationId),
        );
        return;
      }

      if (event.type === 'notification:all-read') {
        setNotifications((current) =>
          current.map((item) => ({
            ...item,
            readAt: item.readAt ?? event.readAt,
          })),
        );
      }
    });
  }, []);

  return {
    notifications,
    message,
    isSuccess,
    load,
    markRead,
    markAllRead,
    remove,
  };
}
