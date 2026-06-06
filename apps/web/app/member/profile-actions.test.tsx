import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileActions from './profile-actions';

const memberRequestMock = vi.fn();

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/member-api');
  return {
    ...actual,
    useMemberRequest: () => memberRequestMock,
  };
});

function deferredResult() {
  let resolve!: (value: { ok: boolean; message: string; data?: unknown }) => void;
  const promise = new Promise<{ ok: boolean; message: string; data?: unknown }>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('ProfileActions interest state', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
  });

  it('shows pending and success feedback when sending an interest', async () => {
    const request = deferredResult();
    memberRequestMock.mockReturnValueOnce(request.promise);

    render(<ProfileActions profileId="profile-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Interest' }));

    expect(memberRequestMock).toHaveBeenCalledWith('/api/interests', {
      method: 'POST',
      body: { profileId: 'profile-1' },
    });
    expect(screen.getByRole('button', { name: 'Sending' })).toBeTruthy();

    request.resolve({ ok: true, message: 'Interest sent successfully' });

    await waitFor(() => {
      expect(screen.getByText('Interest sent successfully')).toBeTruthy();
    });

    expect(screen.getByRole('button', { name: 'Interest' })).toBeTruthy();
  });

  it('shows pending and success feedback when saving a favourite', async () => {
    const request = deferredResult();
    memberRequestMock.mockReturnValueOnce(request.promise);

    render(<ProfileActions profileId="profile-2" compact />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(memberRequestMock).toHaveBeenCalledWith('/api/me/favourites', {
      method: 'POST',
      body: { profileId: 'profile-2' },
    });
    expect(screen.getByRole('button', { name: 'Saving' })).toBeTruthy();

    request.resolve({ ok: true, message: 'Saved to favourites' });

    await waitFor(() => {
      expect(screen.getByText('Saved to favourites')).toBeTruthy();
    });

    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });
});
