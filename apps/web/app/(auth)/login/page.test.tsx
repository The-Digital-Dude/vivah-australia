import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const setSessionMock = vi.fn();
const postAuthMock = vi.fn();
const memberRequestMock = vi.fn();
const searchParamsGetMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => ({
    get: searchParamsGetMock,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}));

vi.mock('react-apple-signin-auth', () => ({
  appleAuthHelpers: {
    signIn: vi.fn(),
  },
}));

vi.mock('react-facebook-login/dist/facebook-login-render-props', () => ({
  default: ({ render }: { render: (props: { onClick: () => void }) => ReactNode }) =>
    render({ onClick: vi.fn() }),
}));

vi.mock('../auth-shell', () => ({
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

vi.mock('../form-field', () => ({
  default: ({
    label,
    name,
    type = 'text',
  }: {
    label: string;
    name: string;
    type?: string;
  }) => (
    <label>
      {label}
      <input aria-label={label} name={name} type={type} />
    </label>
  ),
}));

vi.mock('../submit-button', () => ({
  default: ({
    label,
    pending,
    pendingLabel,
  }: {
    label: string;
    pending: boolean;
    pendingLabel: string;
  }) => <button type="submit">{pending ? pendingLabel : label}</button>,
}));

vi.mock('@/lib/auth-api', () => ({
  postAuth: (...args: unknown[]) => postAuthMock(...args) as unknown,
}));

vi.mock('@/lib/member-api', () => ({
  memberRequest: (...args: unknown[]) => memberRequestMock(...args) as unknown,
}));

vi.mock('@/app/auth-context', () => ({
  useAuth: () => ({
    setSession: setSessionMock,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsGetMock.mockReturnValue(null);
    memberRequestMock.mockResolvedValue({
      ok: true,
      data: {
        profile: {
          completionPercentage: 100,
        },
      },
    });
  });

  it('submits credentials, stores the session, and redirects on success', async () => {
    postAuthMock.mockResolvedValue({
      ok: true,
      message: 'Signed in successfully.',
      data: {
        user: {
          role: 'USER',
        },
      },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email Address or Mobile Number'), {
      target: { value: 'priya@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(postAuthMock).toHaveBeenCalledWith('login', {
        email: 'priya@example.com',
        password: 'StrongPassword123!',
      });
    });
    expect(setSessionMock).toHaveBeenCalledWith({
      user: {
        role: 'USER',
      },
    });
    expect(pushMock).toHaveBeenCalledWith('/member');
    expect(refreshMock).toHaveBeenCalled();
  });

  it('shows an inline error when login fails', async () => {
    postAuthMock.mockResolvedValue({
      ok: false,
      message: 'Invalid email or password',
      data: {},
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email Address or Mobile Number'), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'WrongPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Invalid email or password')).toBeTruthy();
    expect(setSessionMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
