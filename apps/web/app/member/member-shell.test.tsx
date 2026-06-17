'use client';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MemberShell from './member-shell';

const memberRequestMock = vi.fn();
const socketOnMock = vi.fn();
const socketDisconnectMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/member/messages',
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('socket.io-client', () => ({
  io: () => ({
    on: socketOnMock,
    disconnect: socketDisconnectMock,
  }),
}));

vi.mock('@/app/auth-context', () => ({
  useAuth: () => ({
    initialized: true,
    token: 'member-token',
    clearToken: vi.fn(),
  }),
}));

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/member-api');
  return {
    ...actual,
    useMemberRequest: () => memberRequestMock,
  };
});

vi.mock('@/app/components', () => ({
  PublicHeader: () => <div>Public header</div>,
}));

describe('MemberShell realtime notification badge', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
    socketOnMock.mockReset();
    socketDisconnectMock.mockReset();
    replaceMock.mockReset();

    memberRequestMock.mockImplementation((url: string) => {
      if (url === '/api/me/notifications?unreadOnly=true') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: { unreadCount: 2, notifications: [] },
        });
      }

      if (url === '/api/me/profile') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            profile: {
              personal: { firstName: 'Priya' },
              moderation: { approvalStatus: 'APPROVED' },
            },
          },
        });
      }

      return Promise.resolve({ ok: false, message: `Unexpected request: ${url}` });
    });
  });

  it('updates the notification badge from realtime unread-count events', async () => {
    render(
      <MemberShell title="Dashboard" subtitle="Overview">
        <div>Child content</div>
      </MemberShell>,
    );

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/me/notifications?unreadOnly=true');
    });

    const unreadHandler = socketOnMock.mock.calls.find(
      (call) => call[0] === 'notification:unread-count',
    )?.[1] as ((payload: { unreadCount?: number }) => void) | undefined;

    expect(unreadHandler).toBeTruthy();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);

    unreadHandler?.({ unreadCount: 5 });

    await waitFor(() => {
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    });
  });
});
