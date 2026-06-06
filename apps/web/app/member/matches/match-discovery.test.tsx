import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MatchDiscovery from './match-discovery';

const memberRequestMock = vi.fn();

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/member-api');
  return {
    ...actual,
    useMemberRequest: () => memberRequestMock,
  };
});

vi.mock('../profile-actions', () => ({
  default: () => <div>Profile actions</div>,
}));

vi.mock('@/app/components', () => ({
  EmptyState: ({
    children,
    title,
  }: {
    children?: ReactNode;
    title: string;
  }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
  FilterDrawer: ({
    children,
    open,
    title,
  }: {
    children: ReactNode;
    open: boolean;
    title?: string;
  }) => (open ? <section aria-label={title ?? 'Filters'}>{children}</section> : null),
  MatchGridSkeleton: () => <div>Loading matches</div>,
  PremiumButton: ({
    children,
    type = 'button',
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type={type} {...props}>
      {children}
    </button>
  ),
  PremiumCard: ({
    children,
  }: {
    children: ReactNode;
  }) => <section>{children}</section>,
  ProfileMatchCard: ({
    profile,
    actions,
  }: {
    actions?: ReactNode;
    profile: { name: string };
  }) => (
    <article>
      <h3>{profile.name}</h3>
      {actions}
    </article>
  ),
  SectionHeader: ({
    title,
    subtitle,
  }: {
    subtitle?: string;
    title: string;
  }) => (
    <header>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  ),
}));

function createMemberRequestResponse(url: string) {
  if (url.startsWith('/api/matches/recommended')) {
    return Promise.resolve({
      ok: true,
      message: '',
      data: { results: [] },
    });
  }

  if (url === '/api/matches/saved-searches') {
    return Promise.resolve({
      ok: true,
      message: '',
      data: { savedSearches: [] },
    });
  }

  if (url === '/api/me/profile') {
    return Promise.resolve({
      ok: true,
      message: '',
      data: {
        profile: {
          location: {
            city: 'Melbourne',
            state: 'VIC',
          },
        },
      },
    });
  }

  if (url.startsWith('/api/matches/search?')) {
    return Promise.resolve({
      ok: true,
      message: '',
      data: {
        results: [
          {
            id: 'profile-1',
            firstName: 'Anaya',
            verificationLevel: 'GOLD',
            matchScore: 87,
            matchReasons: ['Shared values'],
          },
        ],
        limits: {
          planCode: 'FREE',
          searchPageSize: 12,
          recommendationLimit: 24,
          advancedFilters: true,
        },
      },
    });
  }

  return Promise.resolve({
    ok: false,
    message: `Unexpected request: ${url}`,
  });
}

describe('MatchDiscovery filters', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
    memberRequestMock.mockImplementation((url: string) => createMemberRequestResponse(url));
  });

  it('applies the visa quick filter and surfaces the filter chip', async () => {
    render(<MatchDiscovery />);

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/matches/search?page=1&pageSize=12&sort=RECOMMENDED');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Citizen / PR' }));

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith(
        '/api/matches/search?page=1&pageSize=12&sort=RECOMMENDED&visaStatus=Australian+Citizen&visaStatus=Permanent+Resident',
      );
    });

    expect(screen.getByText('Visa: Australian Citizen, Permanent Resident')).toBeTruthy();
  });

  it('submits advanced filters and sends the updated search query', async () => {
    render(<MatchDiscovery />);

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/matches/search?page=1&pageSize=12&sort=RECOMMENDED');
    });

    fireEvent.click(screen.getByRole('button', { name: /advanced filters/i }));

    fireEvent.change(screen.getByLabelText('City'), {
      target: { value: 'Sydney, Parramatta' },
    });
    fireEvent.change(screen.getByLabelText('Visa status'), {
      target: { value: 'Student Visa, Work Visa' },
    });

    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith(
        '/api/matches/search?page=1&pageSize=12&sort=RECOMMENDED&city=Sydney&city=Parramatta&visaStatus=Student+Visa&visaStatus=Work+Visa',
      );
    });

    expect(screen.getByText('Near: Sydney, Parramatta')).toBeTruthy();
    expect(screen.getByText('Visa: Student Visa, Work Visa')).toBeTruthy();
  });
});
