import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileForm from './profile-form';

const pushMock = vi.fn();
const replaceMock = vi.fn();
const memberRequestMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/member-api');
  return {
    ...actual,
    useMemberRequest: () => memberRequestMock,
  };
});

function createProfileResponse() {
  return {
    ok: true,
    message: '',
    data: {
      profile: {
        id: 'profile-123',
        moderation: {
          approvalStatus: 'DRAFT',
        },
        personal: {},
        location: {},
        religion: {},
        education: {},
        employment: {},
        family: {},
        lifestyle: {},
        about: {},
        partnerPreference: {},
      },
    },
  };
}

describe('ProfileForm draft saving', () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    memberRequestMock.mockReset();
    memberRequestMock.mockImplementation((url: string, options?: { method?: string }) => {
      if (url === '/api/me/profile' && !options) {
        return Promise.resolve(createProfileResponse());
      }

      if (url === '/api/me/profile' && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          message: 'Draft saved successfully',
          data: {},
        });
      }

      if (url === '/api/me/profile/submit') {
        return Promise.resolve({
          ok: true,
          message: 'Submitted successfully',
          data: {},
        });
      }

      return Promise.resolve({
        ok: false,
        message: `Unexpected request: ${url}`,
      });
    });
  });

  function patchCalls() {
    return memberRequestMock.mock.calls.filter(
      (call) => call[0] === '/api/me/profile' && (call[1] as { method?: string } | undefined)?.method === 'PATCH',
    );
  }

  it('saves the current draft without leaving the step', async () => {
    render(<ProfileForm mode="edit" />);

    await waitFor(() => {
      expect(screen.getByLabelText('First name')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('First name'), {
      target: { value: 'Priya' },
    });
    fireEvent.change(screen.getByLabelText('Last name'), {
      target: { value: 'Sharma' },
    });
    fireEvent.change(screen.getByLabelText('Gender'), {
      target: { value: 'FEMALE' },
    });
    fireEvent.change(screen.getByLabelText('Date of birth'), {
      target: { value: '1994-05-11' },
    });
    fireEvent.change(screen.getByLabelText('Marital status'), {
      target: { value: 'NEVER_MARRIED' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => {
      expect(patchCalls().length).toBeGreaterThan(0);
    });

    expect(patchCalls().at(-1)).toEqual([
      '/api/me/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.objectContaining({
          personal: expect.objectContaining({
            firstName: 'Priya',
            lastName: 'Sharma',
            gender: 'FEMALE',
            dateOfBirth: expect.any(Date) as unknown,
            maritalStatus: 'NEVER_MARRIED',
          }) as unknown,
        }) as unknown,
      }) as unknown,
    ]);

    expect(screen.getByText('Draft saved successfully')).toBeTruthy();
    expect(screen.getByText('Step 1 of 10')).toBeTruthy();
  });

  it('saves and continues through consecutive steps with updated payloads', async () => {
    render(<ProfileForm mode="onboarding" />);

    await waitFor(() => {
      expect(screen.getByLabelText('First name')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('First name'), {
      target: { value: 'Anaya' },
    });
    fireEvent.change(screen.getByLabelText('Last name'), {
      target: { value: 'Patel' },
    });
    fireEvent.change(screen.getByLabelText('Gender'), {
      target: { value: 'FEMALE' },
    });
    fireEvent.change(screen.getByLabelText('Date of birth'), {
      target: { value: '1993-10-04' },
    });
    fireEvent.change(screen.getByLabelText('Marital status'), {
      target: { value: 'NEVER_MARRIED' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save & continue' }));

    await waitFor(() => {
      expect(screen.getByText('Location & Residency')).toBeTruthy();
    });

    expect(patchCalls().at(-1)).toEqual([
      '/api/me/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.objectContaining({
          personal: expect.objectContaining({
            firstName: 'Anaya',
            lastName: 'Patel',
            dateOfBirth: expect.any(Date) as unknown,
          }) as unknown,
        }) as unknown,
      }) as unknown,
    ]);

    fireEvent.change(screen.getByLabelText('Country'), {
      target: { value: 'Australia' },
    });
    fireEvent.change(screen.getByLabelText('State / Territory'), {
      target: { value: 'Victoria' },
    });
    fireEvent.change(screen.getByLabelText('City'), {
      target: { value: 'Melbourne' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save & continue' }));

    await waitFor(() => {
      expect(screen.getByText('Religion & Community')).toBeTruthy();
    });

    expect(patchCalls().at(-1)).toEqual([
      '/api/me/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.objectContaining({
          location: expect.objectContaining({
            country: 'Australia',
            state: 'Victoria',
            city: 'Melbourne',
          }) as unknown,
        }) as unknown,
      }) as unknown,
    ]);

    expect(screen.getByText('Step 3 of 10')).toBeTruthy();
  });
});
