import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MemberDashboardPage from './page';

const memberRequestMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/member-api');
  return {
    ...actual,
    useMemberRequest: () => memberRequestMock,
  };
});

vi.mock('@/lib/use-entitlement', () => ({
  useEntitlement: () => ({
    plan: { name: 'Premium', limits: { profileBoostsMonthly: 1 } },
    usage: [],
    refresh: vi.fn(),
  }),
}));

vi.mock('./member-shell', () => ({
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
  EmptyState: ({ title, children }: { title: string; children?: ReactNode }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
  PremiumButton: ({
    children,
    href,
    onClick,
  }: {
    children: ReactNode;
    href?: string;
    onClick?: () => void;
  }) => (
    <button data-href={href} onClick={onClick}>
      {children}
    </button>
  ),
  PremiumCard: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  ProfileMatchCard: ({ profile }: { profile: { name: string } }) => <div>{profile.name}</div>,
}));

vi.mock('./profile-strength-meter', () => ({
  __esModule: true,
  default: ({ strength }: { strength?: { percentage?: number } | null }) => (
    <div>Strength {strength?.percentage ?? 0}%</div>
  ),
}));

describe('MemberDashboardPage profile-view prominence', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
    replaceMock.mockReset();
    memberRequestMock.mockImplementation((url: string) => {
      if (url === '/api/me/profile') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            profile: {
              id: 'profile-1',
              personal: { firstName: 'Priya' },
              completionPercentage: 72,
              profileStrength: {
                percentage: 72,
                nextAction: {
                  href: '/member/profile/edit?section=about',
                  actionLabel: 'Write About Me',
                },
              },
              verification: { level: 'BASIC' },
              stats: { interestsReceived: 2, profileViews: 9 },
              moderation: { approvalStatus: 'APPROVED' },
            },
          },
        });
      }

      if (url === '/api/matches/recommended?limit=4' || url === '/api/matches/recommended?limit=4&mode=RECENTLY_ACTIVE') {
        return Promise.resolve({ ok: true, message: '', data: { results: [] } });
      }

      if (url === '/api/me/interests?box=received') {
        return Promise.resolve({ ok: true, message: '', data: { interests: [] } });
      }

      if (url === '/api/me/boosts') {
        return Promise.resolve({ ok: true, message: '', data: { boosts: [] } });
      }

      if (url === '/api/me/conversations') {
        return Promise.resolve({ ok: true, message: '', data: { data: [] } });
      }

      if (url === '/api/me/profile-viewers') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: { total: 14, isPaid: true, viewers: [] },
        });
      }

      return Promise.resolve({ ok: false, message: `Unexpected request: ${url}` });
    });
  });

  it('surfaces profile views prominently on the dashboard and links to the viewers page', async () => {
    render(<MemberDashboardPage />);

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/me/profile-viewers');
    });

    expect(screen.getAllByText('Profile views').length).toBeGreaterThan(0);
    expect(screen.getAllByText('14').length).toBeGreaterThan(0);
    const profileViewsLink = screen
      .getAllByRole('link', { name: 'View all' })
      .find((element) => element.getAttribute('href') === '/member/profile-viewers');
    expect(profileViewsLink).toBeTruthy();
    expect(screen.getByText('Open viewers list')).toBeTruthy();
    expect(screen.getByText('Views will appear as members discover you.')).toBeTruthy();
  });
});
