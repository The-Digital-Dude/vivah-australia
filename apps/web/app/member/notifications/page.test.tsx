import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MemberNotificationsPage from './page';
import { dispatchNotificationRealtimeEvent } from '@/lib/notification-realtime';

const memberRequestMock = vi.fn();

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/member-api');
  return {
    ...actual,
    useMemberRequest: () => memberRequestMock,
  };
});

vi.mock('../member-shell', () => ({
  default: ({
    children,
    title,
    subtitle,
  }: {
    children: ReactNode;
    title: string;
    subtitle: string;
  }) => (
    <section>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </section>
  ),
}));

vi.mock('@/app/components', () => ({
  PremiumButton: ({
    children,
    onClick,
    disabled,
    className,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <button disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  ),
  PremiumCard: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

describe('MemberNotificationsPage realtime sync', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
    memberRequestMock.mockImplementation((url: string, options?: { method?: string }) => {
      if (url === '/api/me/notifications') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            notifications: [
              {
                _id: 'notif-1',
                type: 'INTEREST_RECEIVED',
                title: 'Interest received',
                body: 'A member sent you an interest.',
                createdAt: '2026-06-18T10:00:00.000Z',
              },
            ],
          },
        });
      }

      if (url === '/api/me/notifications/notif-1/read' && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: { notification: { _id: 'notif-1', readAt: '2026-06-18T11:00:00.000Z' } },
        });
      }

      if (url === '/api/me/notifications/read-all' && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: { updated: 1 },
        });
      }

      if (url === '/api/me/notifications/notif-1' && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          message: 'Notification deleted',
          data: {},
        });
      }

      return Promise.resolve({ ok: false, message: `Unexpected request: ${url}` });
    });
  });

  it('updates the list from realtime create, update, all-read, and delete events', async () => {
    render(<MemberNotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Interest received')).toBeTruthy();
    });

    dispatchNotificationRealtimeEvent({
      type: 'notification:new',
      notification: {
        _id: 'notif-2',
        type: 'PROFILE_VIEW',
        title: 'Someone viewed your profile',
        body: 'A member checked your profile.',
        createdAt: '2026-06-18T12:00:00.000Z',
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Someone viewed your profile')).toBeTruthy();
    });

    dispatchNotificationRealtimeEvent({
      type: 'notification:updated',
      notification: {
        _id: 'notif-2',
        type: 'PROFILE_VIEW',
        title: 'Someone viewed your profile',
        body: 'This viewer has now shortlisted you.',
        readAt: '2026-06-18T12:10:00.000Z',
        createdAt: '2026-06-18T12:00:00.000Z',
        updatedAt: '2026-06-18T12:10:00.000Z',
      },
    });

    await waitFor(() => {
      expect(screen.getByText('This viewer has now shortlisted you.')).toBeTruthy();
    });

    dispatchNotificationRealtimeEvent({
      type: 'notification:all-read',
      readAt: '2026-06-18T12:15:00.000Z',
    });

    await waitFor(() => {
      expect(screen.queryByLabelText('Mark as read')).toBeNull();
    });

    dispatchNotificationRealtimeEvent({
      type: 'notification:deleted',
      notificationId: 'notif-2',
    });

    await waitFor(() => {
      expect(screen.queryByText('Someone viewed your profile')).toBeNull();
    });
  });

  it('keeps mark-all-read wired through the existing route', async () => {
    render(<MemberNotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Interest received')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /mark all read/i }));

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/me/notifications/read-all', { method: 'PATCH' });
    });
  });
});
