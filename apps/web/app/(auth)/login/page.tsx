'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postAuth } from '@/lib/auth-api';
import { useAuth } from '@/app/auth-context';

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}

export default function LoginPage() {
  const router = useRouter();
  const { setToken } = useAuth();
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
        setToken(result.data.accessToken);
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
    <div className="flex h-screen items-center justify-center bg-[#FFF8F1] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-[#7A1E3A]/10">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold text-[#232323]">Welcome back</h2>
          <p className="mt-2 text-center text-sm text-[#5E6470]">
            Sign in to your Vivah Australia account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={(event) => void handleSubmit(event)}>
          {error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm text-center">
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
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-[#7A1E3A]/20 placeholder-[#5E6470] text-[#232323] focus:outline-none focus:ring-[#7A1E3A] focus:border-[#7A1E3A] sm:text-sm transition-colors"
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
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-[#7A1E3A]/20 placeholder-[#5E6470] text-[#232323] focus:outline-none focus:ring-[#7A1E3A] focus:border-[#7A1E3A] sm:text-sm transition-colors"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-[#7A1E3A] hover:text-[#64172f]"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={pending}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#7A1E3A' }}
            >
              {pending ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
