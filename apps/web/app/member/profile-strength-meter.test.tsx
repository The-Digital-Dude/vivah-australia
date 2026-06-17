import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ProfileStrengthMeter from './profile-strength-meter';
import type { ProfileStrength } from './profile-strength-meter';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ProfileStrengthMeter', () => {
  it('renders the completion percentage and one next-action link', () => {
    const strength: ProfileStrength = {
      percentage: 64,
      missing: [
        {
          key: 'profilePhoto',
          label: 'Add a profile photo',
          description: 'Profiles with a clear photo are easier for families and matches to trust.',
          actionLabel: 'Upload photo',
          section: 'photos',
          href: '/member/media',
        },
        {
          key: 'aboutMe',
          label: 'Write your About Me',
          description: 'Tell serious matches who you are.',
          actionLabel: 'Write About Me',
          section: 'about',
          href: '/member/profile/edit?section=about',
        },
      ],
      nextAction: {
        key: 'profilePhoto',
        label: 'Add a profile photo',
        description: 'Profiles with a clear photo are easier for families and matches to trust.',
        actionLabel: 'Upload photo',
        section: 'photos',
        href: '/member/media',
      },
    };

    render(<ProfileStrengthMeter strength={strength} />);

    expect(screen.getByText('64%')).toBeTruthy();
    expect(screen.getByText('Add a profile photo')).toBeTruthy();
    expect(screen.queryByText('Write your About Me')).toBeNull();

    const action = screen.getByRole('link', { name: /upload photo/i });
    expect(action.getAttribute('href')).toBe('/member/media');
  });
});
