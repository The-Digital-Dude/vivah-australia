import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MessagesClient from './messages-client';

const memberRequestMock = vi.fn();
const socketEmitMock = vi.fn();
const socketOnMock = vi.fn();
const socketDisconnectMock = vi.fn();

vi.mock('@/app/auth-context', () => ({
  useAuth: () => ({
    token: 'cookie-based',
  }),
}));

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/member-api');
  return {
    ...actual,
    useMemberRequest: () => memberRequestMock,
  };
});

vi.mock('socket.io-client', () => ({
  io: () => ({
    emit: socketEmitMock,
    on: socketOnMock,
    disconnect: socketDisconnectMock,
  }),
}));

vi.mock('../profile-actions', () => ({
  default: ({ profileId }: { profileId: string }) => <div>Profile actions for {profileId}</div>,
}));

vi.stubGlobal('fetch', vi.fn());
vi.stubGlobal(
  'IntersectionObserver',
  class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds = [0];
  },
);

describe('MessagesClient rendering', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
    socketEmitMock.mockReset();
    socketOnMock.mockReset();
    socketDisconnectMock.mockReset();

    memberRequestMock.mockImplementation((url: string, options?: { method?: string }) => {
      if (url === '/api/me/profile') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            profile: {
              id: 'my-profile',
              userId: 'member-1',
              personal: {
                firstName: 'Aarav',
              },
            },
          },
        });
      }

      if (url === '/api/me/conversations') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            data: [
              {
                id: 'conv-1',
                isLocked: false,
                otherProfile: {
                  id: 'profile-1',
                  firstName: 'Anaya',
                  age: 29,
                  city: 'Melbourne',
                  occupation: 'Engineer',
                },
              },
              {
                id: 'conv-2',
                isLocked: false,
                otherProfile: {
                  id: 'profile-2',
                  firstName: 'Rahul',
                  age: 31,
                  city: 'Sydney',
                  occupation: 'Doctor',
                },
              },
            ],
          },
        });
      }

      if (url === '/api/me/conversations/conv-1/messages?limit=50') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            messages: [
              {
                id: 'msg-1',
                conversationId: 'conv-1',
                senderId: 'member-1',
                body: 'Hello Anaya, I enjoyed reading your profile.',
                attachments: [],
                readBy: [],
                createdAt: '2025-01-05T10:30:00.000Z',
              },
              {
                id: 'msg-2',
                conversationId: 'conv-1',
                senderId: 'member-2',
                body: 'Thanks! Here is the family intro.',
                attachments: [
                  {
                    attachmentType: 'DOCUMENT',
                    assetUrl: 'https://files.example.com/intro.pdf',
                    fileName: 'family-intro.pdf',
                    mimeType: 'application/pdf',
                  },
                ],
                readBy: [],
                createdAt: '2025-01-05T10:35:00.000Z',
              },
            ],
          },
        });
      }

      if (url === '/api/me/conversations/conv-1/read' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {},
        });
      }

      return Promise.resolve({
        ok: false,
        message: `Unexpected request: ${url}`,
      });
    });
  });

  it('loads the first conversation and renders its messages and attachments', async () => {
    render(<MessagesClient />);

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/me/profile');
      expect(memberRequestMock).toHaveBeenCalledWith('/api/me/conversations');
      expect(memberRequestMock).toHaveBeenCalledWith('/api/me/conversations/conv-1/messages?limit=50');
    });

    expect(screen.getAllByText('Anaya').length).toBeGreaterThan(0);
    expect(screen.getByText('Melbourne • Engineer')).toBeTruthy();
    expect(screen.getByText('Anaya, 29')).toBeTruthy();
    expect(screen.getByText('Profile actions for profile-1')).toBeTruthy();

    expect(screen.getByText('Hello Anaya, I enjoyed reading your profile.')).toBeTruthy();
    expect(screen.getByText('Thanks! Here is the family intro.')).toBeTruthy();
    expect(screen.getByText('Aarav')).toBeTruthy();
    expect(screen.getAllByText('Anaya').length).toBeGreaterThan(1);
    expect(screen.getByText('You')).toBeTruthy();

    const attachmentLink = screen.getByRole('link', { name: 'family-intro.pdf' });
    expect(attachmentLink).toBeTruthy();
    expect(attachmentLink.getAttribute('href')).toBe('https://files.example.com/intro.pdf');

    expect(socketOnMock).toHaveBeenCalledWith('message:new', expect.any(Function));
    expect(socketOnMock).toHaveBeenCalledWith('typing', expect.any(Function));
  });

  it('renders the accepted-interest empty state when a conversation has no messages', async () => {
    memberRequestMock.mockImplementation((url: string, options?: { method?: string }) => {
      if (url === '/api/me/profile') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            profile: {
              id: 'my-profile',
              userId: 'member-1',
              personal: {
                firstName: 'Aarav',
              },
            },
          },
        });
      }

      if (url === '/api/me/conversations') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            data: [
              {
                id: 'conv-empty',
                isLocked: false,
                otherProfile: {
                  id: 'profile-3',
                  firstName: 'Kiran',
                  age: 27,
                  city: 'Perth',
                  occupation: 'Designer',
                },
              },
            ],
          },
        });
      }

      if (url === '/api/me/conversations/conv-empty/messages?limit=50') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: { messages: [] },
        });
      }

      if (url === '/api/me/conversations/conv-empty/read' && options?.method === 'POST') {
        return Promise.resolve({ ok: true, message: '', data: {} });
      }

      return Promise.resolve({
        ok: false,
        message: `Unexpected request: ${url}`,
      });
    });

    render(<MessagesClient />);

    await waitFor(() => {
      expect(screen.getByText('Start the conversation after your interest has been accepted.')).toBeTruthy();
    });

    expect(screen.getByText('Kiran, 27')).toBeTruthy();
  });

  it('locks the composer when the conversation payload is blocked', async () => {
    memberRequestMock.mockImplementation((url: string, options?: { method?: string }) => {
      if (url === '/api/me/profile') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: { profile: { id: 'my-profile', userId: 'member-1', personal: { firstName: 'Aarav' } } },
        });
      }

      if (url === '/api/me/conversations') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            data: [
              {
                id: 'conv-locked',
                isLocked: true,
                lockReason: 'blocked',
                otherProfile: { id: 'profile-9', firstName: 'Riya', age: 28, city: 'Sydney', occupation: 'Lawyer' },
              },
            ],
          },
        });
      }

      if (url === '/api/me/conversations/conv-locked/messages?limit=50') {
        return Promise.resolve({ ok: true, message: '', data: { messages: [] } });
      }

      if (url === '/api/me/conversations/conv-locked/read' && options?.method === 'POST') {
        return Promise.resolve({ ok: true, message: '', data: {} });
      }

      return Promise.resolve({ ok: false, message: `Unexpected request: ${url}` });
    });

    render(<MessagesClient />);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Write a thoughtful, respectful message…')).toBeNull();
    });
  });

  it('appends later conversation pages with nextCursor and preserves the active selection', async () => {
    memberRequestMock.mockImplementation((url: string, options?: { method?: string }) => {
      if (url === '/api/me/profile') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            profile: {
              id: 'my-profile',
              userId: 'member-1',
              personal: {
                firstName: 'Aarav',
              },
            },
          },
        });
      }

      if (url === '/api/me/conversations') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            data: [
              {
                id: 'conv-1',
                isLocked: false,
                otherProfile: {
                  id: 'profile-1',
                  firstName: 'Anaya',
                  age: 29,
                  city: 'Melbourne',
                  occupation: 'Engineer',
                },
              },
            ],
            nextCursor: 'cursor-2',
          },
        });
      }

      if (url === '/api/me/conversations?cursor=cursor-2') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            data: [
              {
                id: 'conv-2',
                isLocked: false,
                otherProfile: {
                  id: 'profile-2',
                  firstName: 'Rahul',
                  age: 31,
                  city: 'Sydney',
                  occupation: 'Doctor',
                },
              },
            ],
            nextCursor: null,
          },
        });
      }

      if (url === '/api/me/conversations/conv-1/messages?limit=50') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            messages: [
              {
                id: 'msg-1',
                conversationId: 'conv-1',
                senderId: 'member-1',
                body: 'Hello Anaya, I enjoyed reading your profile.',
                attachments: [],
                readBy: [],
                createdAt: '2025-01-05T10:30:00.000Z',
              },
            ],
          },
        });
      }

      if (url === '/api/me/conversations/conv-1/read' && options?.method === 'POST') {
        return Promise.resolve({ ok: true, message: '', data: {} });
      }

      return Promise.resolve({
        ok: false,
        message: `Unexpected request: ${url}`,
      });
    });

    render(<MessagesClient />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Load more conversations' })).toBeTruthy();
    });

    expect(screen.getByText('Anaya, 29')).toBeTruthy();
    expect(screen.queryByText('Rahul')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Load more conversations' }));

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/me/conversations?cursor=cursor-2');
    });

    await waitFor(() => {
      expect(screen.getByText('Rahul')).toBeTruthy();
    });

    expect(screen.getByText('Anaya, 29')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Load more conversations' })).toBeNull();
    expect(screen.getByText('Profile actions for profile-1')).toBeTruthy();
  });
});
