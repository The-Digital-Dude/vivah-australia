import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminUsersPage from './page';

const memberRequestMock = vi.fn();

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/member-api')>('@/lib/member-api');
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

describe('AdminUsersPage table loading and filtering', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
    memberRequestMock.mockImplementation((url: string) => {
      if (url === '/api/admin/users?page=1&pageSize=10') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            users: [
              {
                id: 'user-1',
                email: 'alice@example.com',
                role: 'USER',
                status: 'ACTIVE',
                emailVerified: true,
                createdAt: '2025-01-03T10:00:00.000Z',
                profile: {
                  displayId: 'VIV1001',
                  firstName: 'Alice',
                  lastName: 'Sharma',
                  verificationLevel: 'GOLD',
                },
              },
              {
                id: 'user-2',
                email: 'rahul@example.com',
                role: 'ADMIN',
                status: 'SUSPENDED',
                emailVerified: true,
                createdAt: '2025-02-10T10:00:00.000Z',
                profile: {
                  displayId: 'VIV1002',
                  firstName: 'Rahul',
                  lastName: 'Patel',
                  verificationLevel: 'SILVER',
                },
              },
            ],
          },
        });
      }

      if (
        url ===
        '/api/admin/users?page=1&pageSize=10&q=rahul&role=ADMIN&status=SUSPENDED&verificationLevel=SILVER'
      ) {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            users: [
              {
                id: 'user-2',
                email: 'rahul@example.com',
                role: 'ADMIN',
                status: 'SUSPENDED',
                emailVerified: true,
                createdAt: '2025-02-10T10:00:00.000Z',
                profile: {
                  displayId: 'VIV1002',
                  firstName: 'Rahul',
                  lastName: 'Patel',
                  verificationLevel: 'SILVER',
                },
              },
            ],
          },
        });
      }

      return Promise.resolve({
        ok: false,
        message: `Unexpected request: ${url}`,
      });
    });
  });

  it('loads the admin users table and applies server-backed filters', async () => {
    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/admin/users?page=1&pageSize=10');
    });

    expect(screen.getByText('Alice Sharma')).toBeTruthy();
    expect(screen.getByText('Rahul Patel')).toBeTruthy();
    expect(screen.getByText('alice@example.com')).toBeTruthy();
    expect(screen.getByText('rahul@example.com')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Search name, email, or display ID'), {
      target: { value: 'rahul' },
    });
    fireEvent.change(screen.getByDisplayValue('All Roles'), {
      target: { value: 'ADMIN' },
    });
    fireEvent.change(screen.getByDisplayValue('All Verification Levels'), {
      target: { value: 'SILVER' },
    });
    fireEvent.change(screen.getByDisplayValue('All Account Statuses'), {
      target: { value: 'SUSPENDED' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith(
        '/api/admin/users?page=1&pageSize=10&q=rahul&role=ADMIN&status=SUSPENDED&verificationLevel=SILVER',
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Rahul Patel')).toBeTruthy();
    });

    expect(screen.queryByText('Alice Sharma')).toBeNull();
    expect(screen.getByText('rahul@example.com')).toBeTruthy();
  });
});
