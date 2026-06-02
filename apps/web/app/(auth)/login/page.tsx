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
        setTimeout(() => router.push('/member/onboarding'), 500);
      } else {
        setError(result.message || 'Login failed');
        setPending(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during login');
      setPending(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back to Vivah Australia"
      subtitle="Sign in to your Vivah Australia account to discover your perfect match."
    >
      <form className="grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
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
          <FormField label="Email Address" name="email" type="email" autoComplete="email" />
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="text-sm font-bold text-[#1A1A1A]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#7A1F2B] hover:text-[#651925]"
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
              className="h-12 w-full rounded-2xl border border-[#7A1F2B]/20 bg-white px-4 text-[#1A1A1A] placeholder-[#6B7280] outline-none transition focus:border-[#7A1F2B] focus:ring-4 focus:ring-[#F8E8E8] text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="mt-2">
          <SubmitButton label="Sign In" pendingLabel="Signing in..." pending={pending} />
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-[#6B7280]">
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-[#7A1F2B] hover:text-[#651925]">
              Create free profile
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
