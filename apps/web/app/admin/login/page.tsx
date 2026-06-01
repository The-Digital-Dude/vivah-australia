'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { postAuth } from '@/lib/auth-api';

const adminRoles = new Set(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']);

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await postAuth('login', {
      email: formValue(form, 'email'),
      password: formValue(form, 'password'),
    });

    const role = (result.data?.user as { role?: string } | undefined)?.role;
    if (!result.ok || !result.data?.accessToken) {
      setError(result.message || 'Login failed');
      setPending(false);
      return;
    }
    if (!role || !adminRoles.has(role)) {
      setError('Admin access required.');
      setPending(false);
      return;
    }

    setSession({
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
    });
    router.push('/admin/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF8F1] px-4 py-10 text-[#232323]">
      <section className="w-full max-w-md rounded-lg border border-[#7A1E3A]/10 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-[#7A1E3A]" />
          <div>
            <h1 className="text-2xl font-semibold">Admin login</h1>
            <p className="text-sm text-[#5E6470]">Restricted to moderators and administrators.</p>
          </div>
        </div>
        <form className="mt-8 grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <input
            name="email"
            type="email"
            required
            placeholder="Email address"
            className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 outline-none focus:border-[#7A1E3A]"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 outline-none focus:border-[#7A1E3A]"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-md bg-[#7A1E3A] px-4 text-sm font-semibold text-white disabled:bg-neutral-400"
          >
            {pending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
