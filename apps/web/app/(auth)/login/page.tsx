'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicFooter, PublicHeader } from '@/app/components';
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
    <div className="min-h-screen bg-[#FCFAF7] text-[#1A1A1A]">
      <PublicHeader />
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-[#7A1F2B]/10 bg-white p-8 shadow-[0_18px_50px_rgba(122,31,43,0.08)] sm:p-10">
          <div>
            <h2 className="mt-2 text-center text-3xl font-bold text-[#1A1A1A]">Welcome back</h2>
            <p className="mt-2 text-center text-sm text-[#6B7280]">
              Sign in to your Vivah Australia account
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={(event) => void handleSubmit(event)}>
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700">
                {message}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full appearance-none rounded-2xl border border-[#7A1F2B]/20 px-4 py-3 text-[#1A1A1A] placeholder-[#6B7280] transition-colors focus:border-[#7A1F2B] focus:outline-none focus:ring-4 focus:ring-[#F8E8E8] sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="relative block w-full appearance-none rounded-2xl border border-[#7A1F2B]/20 px-4 py-3 text-[#1A1A1A] placeholder-[#6B7280] transition-colors focus:border-[#7A1F2B] focus:outline-none focus:ring-4 focus:ring-[#F8E8E8] sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-[#7A1F2B] hover:text-[#64172f]"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={pending}
                className="relative flex w-full justify-center rounded-2xl border border-transparent bg-[#7A1F2B] px-4 py-3 text-sm font-bold text-white transition-opacity hover:bg-[#651925] disabled:opacity-50"
              >
                {pending ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
