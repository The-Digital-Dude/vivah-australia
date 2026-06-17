import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsManagerPage from './page';

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

const savedRules = {
  BASIC: { allOf: ['emailVerified'] },
  SILVER: { allOf: ['emailVerified', 'mobileVerified'] },
  GOLD: {
    allOf: ['emailVerified', 'mobileVerified', 'identityVerified'],
    atLeast: [{ count: 1, from: ['addressVerified', 'employmentVerified', 'visaVerified'] }],
  },
  PLATINUM: {
    allOf: ['emailVerified', 'mobileVerified', 'identityVerified'],
    atLeast: [{ count: 2, from: ['addressVerified', 'employmentVerified', 'visaVerified'] }],
  },
  FULLY_VERIFIED: {
    allOf: ['emailVerified', 'mobileVerified', 'identityVerified', 'addressVerified'],
    atLeast: [
      { count: 1, from: ['employmentVerified', 'visaVerified'] },
      { count: 1, from: ['policeClearanceVerified', 'facialVerified'] },
    ],
  },
};

describe('SettingsManagerPage verification badge rules', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
    memberRequestMock.mockImplementation((url: string, options?: { method?: string; body?: Record<string, unknown> }) => {
      if (url === '/api/admin/settings' && !options) {
        return Promise.resolve({
          ok: true,
          message: '',
          data: {
            settings: [
              {
                key: 'siteName',
                value: 'Vivah Australia',
              },
              {
                key: 'verificationBadgeRules',
                value: savedRules,
              },
            ],
          },
        });
      }

      if (url === '/api/admin/settings/verificationBadgeRules' && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          message: 'Saved',
          data: {},
        });
      }

      return Promise.resolve({
        ok: false,
        message: `Unexpected request: ${url}`,
      });
    });
  });

  it('renders, saves, and reloads verification badge rules', async () => {
    render(<SettingsManagerPage />);

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/admin/settings');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Verification Rules' }));

    await waitFor(() => {
      expect(screen.getByText('Verification Badge Rules')).toBeTruthy();
    });

    const facialCheckbox = screen.getAllByLabelText('Facial').at(0);
    expect(facialCheckbox).toBeTruthy();
    if (!facialCheckbox) {
      throw new Error('Expected a Facial checkbox');
    }
    fireEvent.click(facialCheckbox);
    fireEvent.click(screen.getByRole('button', { name: 'Save Badge Rules' }));

    await waitFor(() => {
      const saveCall = memberRequestMock.mock.calls.find((call) => {
        const [url] = call as [unknown, unknown?];
        return url === '/api/admin/settings/verificationBadgeRules';
      });

      expect(saveCall).toBeTruthy();

      const [, options] = saveCall as [
        string,
        { method?: string; body?: { value?: { BASIC?: { allOf?: string[] } } } },
      ];

      expect(options?.method).toBe('PUT');
      expect(options?.body?.value?.BASIC?.allOf).toEqual(
        expect.arrayContaining(['emailVerified', 'facialVerified']),
      );
    });

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/admin/settings');
    });
  });
});
