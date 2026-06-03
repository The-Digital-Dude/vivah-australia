'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import AuthShell from '../auth-shell';
import FormField from '../form-field';
import SubmitButton from '../submit-button';
import { postAuth } from '@/lib/auth-api';

export default function ForgotPasswordPage() {
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
      const result = await postAuth('forgot-password', { email: form.get('email') });
      if (result.ok) {
        setSuccess(result.message || 'If an account exists, a reset link will be sent.');
      } else {
        setError(result.message || 'Failed to send reset link.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password securely"
      subtitle="Enter your email below and we will send you a secure link to reset your account password."
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

        <FormField label="Email Address" name="email" type="email" autoComplete="email" />

        <div className="mt-2">
          <SubmitButton label="Send Reset Link" pendingLabel="Sending..." pending={pending} />
        </div>

        <div className="text-center mt-4">
          <Link href="/login" className="font-bold text-sm text-[#A10E4D] hover:text-[#890B40]">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
