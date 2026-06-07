'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '../auth-shell';
import FormField from '../form-field';
import SubmitButton from '../submit-button';
import { postAuth } from '@/lib/auth-api';
import { useAuth } from '@/app/auth-context';

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = formValue(form, 'email');
    const password = formValue(form, 'password');

    try {
      const result = await postAuth('login', { email, password });

      if (result.ok && result.data?.accessToken) {
        setSession({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        });
        setMessage('Signed in successfully.');
        router.push('/member');
        router.refresh();
      } else {
        setError(result.message || 'Login failed');
        setPending(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during login');
      setPending(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setError('');
    setMessage('');
    setPending(true);

    try {
      const mockToken = provider === 'google' ? 'mock-google-token' : 'mock-facebook-token';
      const result = await postAuth(`oauth/${provider}`, { token: mockToken });
      const data = result.data as {
        tokenPair?: {
          accessToken: string;
          refreshToken: string;
        };
      } | undefined;

      if (result.ok && data?.tokenPair?.accessToken && data.tokenPair.refreshToken) {
        setSession({
          accessToken: data.tokenPair.accessToken,
          refreshToken: data.tokenPair.refreshToken,
        });
        setMessage('Signed in successfully.');
        router.push('/member');
        router.refresh();
      } else {
        setError(result.message || 'Social login failed');
        setPending(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during social login');
      setPending(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back to Vivah Australia"
      subtitle="Sign in to your Vivah Australia account to discover your perfect match."
    >
      <form method="post" className="grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-sm font-semibold text-green-700">
            {message}
          </div>
        )}

        <div className="grid gap-4">
          <FormField
            label="Email Address or Mobile Number"
            name="email"
            type="text"
            autoComplete="username"
          />
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="text-sm font-bold text-[#2F2F2F]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#A10E4D] hover:text-[#890B40]"
              >
                Forgot your password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-12 w-full rounded-2xl border border-[#A10E4D]/20 bg-white px-4 text-[#2F2F2F] placeholder-[#6B7280] outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3] text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="mt-2">
          <SubmitButton label="Sign In" pendingLabel="Signing in..." pending={pending} />
        </div>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#A10E4D]/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#FFF9F5] px-2 text-[#5F5F5F] font-semibold">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void handleOAuth('google')}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#A10E4D]/10 bg-white px-4 text-sm font-semibold text-[#2F2F2F] hover:bg-[#FFF0F3] transition"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => void handleOAuth('facebook')}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#A10E4D]/10 bg-white px-4 text-sm font-semibold text-[#2F2F2F] hover:bg-[#FFF0F3] transition"
          >
            Facebook
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-[#6B7280]">
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-[#A10E4D] hover:text-[#890B40]">
              Create free profile
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
