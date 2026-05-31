'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/app/auth-context';
import AuthShell from '../auth-shell';
import FormField from '../form-field';
import SubmitButton from '../submit-button';
import { postAuth } from '@/lib/auth-api';

export default function LoginPage() {
  const router = useRouter();
  const { setToken } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await postAuth('login', {
      email: form.get('email'),
      password: form.get('password'),
    });

    if (result.ok && result.data?.accessToken) {
      setToken(result.data.accessToken);
      setMessage('Signed in successfully.');
      // Redirect to member page after a short delay
      setTimeout(() => router.push('/member/onboarding'), 500);
    } else {
      setMessage(result.message);
    }
    setPending(false);
  }

  return (
    <AuthShell title="Sign in" subtitle="Access your profile, matches, and messages.">
      <form className="grid gap-4" onSubmit={(event) => void onSubmit(event)}>
        <FormField label="Email" name="email" type="email" autoComplete="email" />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <SubmitButton label="Sign in" pendingLabel="Signing in..." pending={pending} />
        {message ? <p className="text-sm text-neutral-700">{message}</p> : null}
        <div className="flex flex-wrap justify-between gap-3 text-sm text-neutral-600">
          <Link href="/forgot-password" className="font-medium text-red-700">
            Forgot password?
          </Link>
          <Link href="/register" className="font-medium text-red-700">
            Create account
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
