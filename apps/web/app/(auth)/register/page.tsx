'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import AuthShell from '../auth-shell';
import FormField from '../form-field';
import SubmitButton from '../submit-button';
import { postAuth } from '@/lib/auth-api';

export default function RegisterPage() {
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
      const result = await postAuth('register/email', {
        email: form.get('email'),
        password: form.get('password'),
        firstName: form.get('firstName'),
        lastName: form.get('lastName'),
        termsAccepted: form.get('termsAccepted') === 'on',
        marketingConsent: form.get('marketingConsent') === 'on',
      });

      if (result.ok) {
        setSuccess('Registration created successfully. Check your email to verify your account.');
      } else {
        setError(result.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Create your free matrimonial profile"
      subtitle="Start your journey to find culturally aligned matrimonial matches in Australia."
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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First Name" name="firstName" autoComplete="given-name" />
            <FormField label="Last Name" name="lastName" autoComplete="family-name" />
          </div>
          <FormField label="Email" name="email" type="email" autoComplete="email" />
          <FormField label="Password" name="password" type="password" autoComplete="new-password" />
        </div>

        <div className="grid gap-3">
          <label className="flex items-start gap-3 text-xs leading-relaxed text-[#6B7280] select-none cursor-pointer">
            <input
              name="termsAccepted"
              type="checkbox"
              required
              className="mt-0.5 size-4 accent-[#7A1F2B] rounded border-[#7A1F2B]/20"
            />
            <span>
              I accept the{' '}
              <Link href="/terms" className="font-bold text-[#7A1F2B] hover:underline">
                Terms of Use
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-bold text-[#7A1F2B] hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <label className="flex items-start gap-3 text-xs leading-relaxed text-[#6B7280] select-none cursor-pointer">
            <input
              name="marketingConsent"
              type="checkbox"
              className="mt-0.5 size-4 accent-[#7A1F2B] rounded border-[#7A1F2B]/20"
            />
            <span>Send me product updates, premium discounts, and matchmaking tips.</span>
          </label>
        </div>

        <div className="mt-2">
          <SubmitButton label="Create Free Profile" pendingLabel="Creating..." pending={pending} />
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-[#6B7280]">
            Already registered?{' '}
            <Link href="/login" className="font-bold text-[#7A1F2B] hover:text-[#651925]">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
