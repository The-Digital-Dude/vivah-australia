'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import AuthShell from '../auth-shell';
import FormField from '../form-field';
import SubmitButton from '../submit-button';
import { postAuth } from '@/lib/auth-api';

export default function RegisterPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);

    const result = await postAuth('register/email', {
      email: form.get('email'),
      password: form.get('password'),
      firstName: form.get('firstName'),
      lastName: form.get('lastName'),
      termsAccepted: form.get('termsAccepted') === 'on',
      marketingConsent: form.get('marketingConsent') === 'on',
    });

    setMessage(
      result.ok ? 'Registration created. Check your email to verify the account.' : result.message,
    );
    setPending(false);
  }

  return (
    <AuthShell title="Create account" subtitle="Start your Vivah Australia member profile.">
      <form className="grid gap-4" onSubmit={(event) => void onSubmit(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" name="firstName" autoComplete="given-name" />
          <FormField label="Last name" name="lastName" autoComplete="family-name" />
        </div>
        <FormField label="Email" name="email" type="email" autoComplete="email" />
        <FormField label="Password" name="password" type="password" autoComplete="new-password" />
        <label className="flex gap-3 text-sm text-neutral-700">
          <input name="termsAccepted" type="checkbox" required className="mt-1 size-4" />I accept
          the terms and privacy policy.
        </label>
        <label className="flex gap-3 text-sm text-neutral-700">
          <input name="marketingConsent" type="checkbox" className="mt-1 size-4" />
          Send me product and membership updates.
        </label>
        <SubmitButton label="Create account" pendingLabel="Creating..." pending={pending} />
        {message ? <p className="text-sm text-neutral-700">{message}</p> : null}
        <p className="text-sm text-neutral-600">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-red-700">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
