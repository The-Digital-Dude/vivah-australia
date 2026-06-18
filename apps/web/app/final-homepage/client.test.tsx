import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FinalHomepageClient from './client';

vi.mock('next/image', () => ({
  default: ({
    alt = '',
    fill: _fill,
    priority: _priority,
    ...props
  }: {
    alt?: string;
    fill?: boolean;
    priority?: boolean;
  }) => <div role="img" aria-label={alt} {...props} />,
}));

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/app/auth-context', () => ({
  useAuth: () => ({
    token: null,
    initialized: true,
  }),
}));

vi.mock('@/app/components/home/final-success-slider', () => ({
  FinalSuccessSlider: () => <div>Success slider</div>,
}));

vi.mock('@/app/components', () => ({
  PublicHeader: () => <div>Header</div>,
  PublicFooter: () => <div>Footer</div>,
  ProfileMatchCard: ({
    profile,
    actions,
  }: {
    profile: { name?: string; isBoosted?: boolean; responsivenessLabel?: string };
    actions?: ReactNode;
  }) => (
    <article>
      <h3>{profile.name}</h3>
      {profile.isBoosted ? <span>Boosted</span> : null}
      {profile.responsivenessLabel ? <span>{profile.responsivenessLabel}</span> : null}
      {actions}
    </article>
  ),
}));

describe('FinalHomepageClient featured members', () => {
  it('renders the featured members row with boosted profiles from the API payload', () => {
    render(
      <FinalHomepageClient
        featuredProfiles={[
          {
            displayId: 'VA901001',
            slug: 'riya-va901001',
            isBoosted: true,
            personal: { firstName: 'Riya', age: 29 },
            location: { city: 'Sydney', state: 'NSW' },
            employment: { occupation: 'Designer' },
            religion: { religion: 'Hindu' },
            verification: { level: 'GOLD' },
            stats: { lastActiveAt: '2026-06-18T08:00:00.000Z' },
            responsivenessLabel: 'Very Responsive',
          },
          {
            displayId: 'VA901002',
            slug: 'anaya-va901002',
            isBoosted: false,
            personal: { firstName: 'Anaya', age: 31 },
            location: { city: 'Melbourne', state: 'VIC' },
            employment: { occupation: 'Architect' },
            religion: { religion: 'Sikh' },
            verification: { level: 'SILVER' },
          },
        ]}
      />,
    );

    expect(screen.getByText('Featured Members')).toBeTruthy();
    expect(screen.getByText('Members getting noticed right now')).toBeTruthy();
    expect(screen.getByText('Riya')).toBeTruthy();
    expect(screen.getByText('Anaya')).toBeTruthy();
    expect(screen.getAllByText('Boosted').length).toBeGreaterThan(0);
    expect(screen.getByText('Very Responsive')).toBeTruthy();
  });
});
