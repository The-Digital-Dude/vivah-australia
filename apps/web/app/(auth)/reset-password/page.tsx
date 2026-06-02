'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import AuthShell from '../auth-shell';
import FormField from '../form-field';
import SubmitButton from '../submit-button';
import { postAuth } from '@/lib/auth-api';

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    const form = new FormData(event.currentTarget);

    try {
      const result = await postAuth('reset-password', {
        token: form.get('token'),
        password: form.get('password'),
      });

      if (result.ok) {
        setSuccess('Password updated successfully. You can now sign in with your new password.');
      } else {
        setError(result.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Set new password"
      subtitle="Complete your password reset by entering your token and selecting a new secure password."
    >
      <form className="grid gap-5" onSubmit={(event) => void onSubmit(event)}>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-4">
          <FormField label="Reset Token" name="token" autoComplete="one-time-code" />
          <FormField
            label="New Password"
            name="password"
            type="password"
            autoComplete="new-password"
          />
        </div>

        <div className="mt-2">
          <SubmitButton label="Update Password" pendingLabel="Updating..." pending={pending} />
        </div>

        <div className="text-center mt-4">
          <Link href="/login" className="font-bold text-sm text-[#7A1F2B] hover:text-[#651925]">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
