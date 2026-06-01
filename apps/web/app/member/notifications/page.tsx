'use client';

import { useEffect, useState } from 'react';
import MemberShell from '../member-shell';
import { useMemberRequest } from '@/lib/member-api';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body?: string;
  readAt?: string;
  createdAt: string;
}

export default function MemberNotificationsPage() {
  const memberRequest = useMemberRequest();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const result = await memberRequest('/api/me/notifications');
    if (result.ok) {
      setNotifications((result.data as { notifications?: NotificationItem[] }).notifications ?? []);
    } else {
      setMessage(result.message);
    }
  }

  async function markRead(id: string) {
    const result = await memberRequest(`/api/me/notifications/${id}/read`, { method: 'PATCH' });
    setMessage(result.ok ? 'Notification marked read.' : result.message);
    if (result.ok) await load();
  }

  async function markAllRead() {
    const result = await memberRequest('/api/me/notifications/read-all', { method: 'PATCH' });
    setMessage(result.ok ? 'Notifications marked read.' : result.message);
    if (result.ok) await load();
  }

  async function remove(id: string) {
    const result = await memberRequest(`/api/me/notifications/${id}`, { method: 'DELETE' });
    setMessage(result.ok ? 'Notification deleted.' : result.message);
    if (result.ok) await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <MemberShell
      title="Notifications"
      subtitle="Review account, profile, verification, subscription, and message updates."
    >
      <div className="mb-4 flex justify-end">
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => void markAllRead()}>
          Mark all read
        </button>
      </div>
      {message ? <p className="mb-4 text-sm text-red-700">{message}</p> : null}
      <div className="grid gap-3">
        {notifications.map((notification) => (
          <article
            key={notification._id}
            className={`rounded-lg border p-4 ${
              notification.readAt ? 'border-neutral-200 bg-white' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  {notification.type}
                </p>
                <h2 className="mt-1 font-semibold">{notification.title}</h2>
                {notification.body ? (
                  <p className="mt-1 text-sm text-neutral-600">{notification.body}</p>
                ) : null}
                <p className="mt-2 text-xs text-neutral-500">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {!notification.readAt ? (
                  <button
                    className="rounded-md border px-3 py-2 text-sm"
                    onClick={() => void markRead(notification._id)}
                  >
                    Read
                  </button>
                ) : null}
                <button
                  className="rounded-md border px-3 py-2 text-sm"
                  onClick={() => void remove(notification._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </MemberShell>
  );
}
