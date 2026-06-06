import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MessagesClient from './messages-client';

const memberRequestMock = vi.fn();
const socketEmitMock = vi.fn();
const socketOnMock = vi.fn();
const socketDisconnectMock = vi.fn();

vi.mock('@/app/auth-context', () => ({
  useAuth: () => ({
    token: 'member-token',
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

describe('MessagesClient rendering', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
    socketEmitMock.mockReset();
    socketOnMock.mockReset();
    socketDisconnectMock.mockReset();

    memberRequestMock.mockImplementation((url: string, options?: { method?: string }) => {
      if (url === '/api/me/conversations') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            conversations: [
              {
                id: 'conv-1',
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

      if (url === '/api/me/conversations/conv-1/messages') {
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
      expect(memberRequestMock).toHaveBeenCalledWith('/api/me/conversations');
      expect(memberRequestMock).toHaveBeenCalledWith('/api/me/conversations/conv-1/messages');
    });

    expect(screen.getByText('Anaya')).toBeTruthy();
    expect(screen.getByText('Melbourne • Engineer')).toBeTruthy();
    expect(screen.getByText('Anaya, 29')).toBeTruthy();
    expect(screen.getByText('Profile actions for profile-1')).toBeTruthy();

    expect(screen.getByText('Hello Anaya, I enjoyed reading your profile.')).toBeTruthy();
    expect(screen.getByText('Thanks! Here is the family intro.')).toBeTruthy();

    const attachmentLink = screen.getByRole('link', { name: 'family-intro.pdf' });
    expect(attachmentLink).toBeTruthy();
    expect(attachmentLink.getAttribute('href')).toBe('https://files.example.com/intro.pdf');

    expect(socketEmitMock).toHaveBeenCalledWith('conversation:join', { conversationId: 'conv-1' });
  });

  it('renders the accepted-interest empty state when a conversation has no messages', async () => {
    memberRequestMock.mockImplementation((url: string, options?: { method?: string }) => {
      if (url === '/api/me/conversations') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            conversations: [
              {
                id: 'conv-empty',
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

      if (url === '/api/me/conversations/conv-empty/messages') {
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
});
