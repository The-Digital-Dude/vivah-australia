import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from './page';

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

vi.mock('../otp-input', () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <label>
      OTP
      <input aria-label="OTP" value={value} onChange={(event) => onChange(event.target.value)} />
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

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits email registration payload and shows success feedback', async () => {
    postAuthMock.mockResolvedValueOnce({
      ok: true,
      message: 'Registered',
      data: {},
    });

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Priya' },
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Sharma' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'priya@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /i accept the/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Free Profile' }));

    await waitFor(() => {
      expect(postAuthMock).toHaveBeenCalledWith('register/email', {
        email: 'priya@example.com',
        password: 'StrongPassword123!',
        firstName: 'Priya',
        lastName: 'Sharma',
        termsAccepted: true,
        marketingConsent: false,
      });
    });
    expect(
      await screen.findByText('Registration created successfully. Check your email to verify your account.'),
    ).toBeTruthy();
  });

  it('completes the mobile OTP registration flow and redirects after verification', async () => {
    postAuthMock
      .mockResolvedValueOnce({
        ok: true,
        message: 'Verification code sent.',
        data: {},
      })
      .mockResolvedValueOnce({
        ok: true,
        message: 'Verified.',
        data: {
          accessToken: 'mobile-access-token',
          refreshToken: 'mobile-refresh-token',
        },
      });

    render(<RegisterPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Mobile signup' }));
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Aarav' },
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Patel' },
    });
    fireEvent.change(screen.getByLabelText('Australian Mobile Number'), {
      target: { value: '+61412345678' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /i accept the/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Create via Mobile' }));

    await waitFor(() => {
      expect(postAuthMock).toHaveBeenNthCalledWith(1, 'register/mobile', {
        mobile: '+61412345678',
        password: 'StrongPassword123!',
        firstName: 'Aarav',
        lastName: 'Patel',
        termsAccepted: true,
        marketingConsent: false,
      });
    });

    expect(
      await screen.findByText('Verification code sent to your mobile. Enter the OTP to activate your account.'),
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText('OTP'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify & Continue' }));

    await waitFor(() => {
      expect(postAuthMock).toHaveBeenNthCalledWith(2, 'otp/verify', {
        mobile: '+61412345678',
        code: '123456',
      });
    });
    expect(setSessionMock).toHaveBeenCalledWith({
      accessToken: 'mobile-access-token',
      refreshToken: 'mobile-refresh-token',
    });
    expect(pushMock).toHaveBeenCalledWith('/member');
    expect(refreshMock).toHaveBeenCalled();
  });
});
