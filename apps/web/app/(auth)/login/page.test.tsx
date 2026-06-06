import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const setSessionMock = vi.fn();
const postAuthMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
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

vi.mock('@/app/auth-context', () => ({
  useAuth: () => ({
    setSession: setSessionMock,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits credentials, stores the session, and redirects on success', async () => {
    postAuthMock.mockResolvedValue({
      ok: true,
      message: 'Signed in successfully.',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
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
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
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
