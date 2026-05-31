'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import AuthShell from '../auth-shell';
import FormField from '../form-field';
import SubmitButton from '../submit-button';
import { postAuth } from '@/lib/auth-api';

export default function ResetPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await postAuth('reset-password', {
      token: form.get('token'),
      password: form.get('password'),
    });

    setMessage(result.message);
    setPending(false);
  }

  return (
    <AuthShell title="Set new password" subtitle="Choose a new password for your account.">
      <form className="grid gap-4" onSubmit={(event) => void onSubmit(event)}>
        <FormField label="Reset token" name="token" autoComplete="one-time-code" />
        <FormField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <SubmitButton label="Update password" pendingLabel="Updating..." pending={pending} />
        {message ? <p className="text-sm text-neutral-700">{message}</p> : null}
        <Link href="/login" className="text-sm font-medium text-red-700">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
