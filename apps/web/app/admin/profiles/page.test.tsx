import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminProfilesPage from './page';

const memberRequestMock = vi.fn();

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/member-api');
  return {
    ...actual,
    useMemberRequest: () => memberRequestMock,
  };
});

vi.mock('../admin-shell', () => ({
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

describe('AdminProfilesPage moderator notes', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
    memberRequestMock.mockImplementation((url: string, options?: { method?: string; body?: Record<string, unknown> }) => {
      if (url === '/api/admin/profiles?status=PENDING') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            profiles: [
              {
                _id: 'profile-1',
                userId: 'user-1',
                displayId: 'VIV2001',
                personal: { firstName: 'Asha', lastName: 'Kapoor' },
                moderation: {
                  approvalStatus: 'PENDING',
                  lastReviewSnapshot: {
                    previous: { aboutMe: 'Old text' },
                    current: { aboutMe: 'New text' },
                  },
                },
                verification: { level: 'GOLD' },
                completionPercentage: 88,
                updatedAt: '2026-06-18T10:00:00.000Z',
              },
            ],
          },
        });
      }

      if (url === '/api/admin/profiles/profile-1') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            profile: {
              _id: 'profile-1',
              userId: 'user-1',
              displayId: 'VIV2001',
              personal: { firstName: 'Asha', lastName: 'Kapoor' },
              moderation: {
                approvalStatus: 'PENDING',
                lastReviewSnapshot: {
                  previous: { aboutMe: 'Old text' },
                  current: { aboutMe: 'New text' },
                },
              },
              verification: { level: 'GOLD' },
              completionPercentage: 88,
              updatedAt: '2026-06-18T10:00:00.000Z',
            },
          },
        });
      }

      if (url === '/api/admin/users/user-1' && !options) {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            notes: [
              {
                id: 'note-1',
                note: 'Previous reviewer flagged photo mismatch.',
                authorId: 'admin-7',
                createdAt: '2026-06-17T08:30:00.000Z',
              },
            ],
          },
        });
      }

      if (url === '/api/admin/users/user-1/notes' && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          message: 'Saved',
          data: {
            note: {
              id: 'note-2',
              note: options.body?.note,
            },
          },
        });
      }

      return Promise.resolve({
        ok: false,
        message: `Unexpected request: ${url}`,
      });
    });
  });

  it('loads existing moderator notes and adds a new one from the profile review surface', async () => {
    render(<AdminProfilesPage />);

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/admin/profiles?status=PENDING');
    });

    fireEvent.click(screen.getByRole('button', { name: /compare draft/i }));

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/admin/profiles/profile-1');
    });
    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/admin/users/user-1');
    });

    expect(screen.getByText('Profile changes')).toBeTruthy();
    expect(screen.getByText('About Me')).toBeTruthy();
    expect(screen.getByText('Old text')).toBeTruthy();
    expect(screen.getByText('New text')).toBeTruthy();
    expect(screen.getByText('Previous reviewer flagged photo mismatch.')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Add internal-only context for the next reviewer...'), {
      target: { value: 'Member confirmed updated passport upload by email.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Note' }));

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/admin/users/user-1/notes', {
        method: 'PATCH',
        body: { note: 'Member confirmed updated passport upload by email.' },
      });
    });

    await waitFor(() => {
      const userDetailCalls = memberRequestMock.mock.calls.filter(
        (call) => call[0] === '/api/admin/users/user-1',
      );
      expect(userDetailCalls.length).toBeGreaterThan(1);
    });
  });
});
