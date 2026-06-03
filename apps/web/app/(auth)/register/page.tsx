'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell from '../auth-shell';
import FormField from '../form-field';
import OtpInput from '../otp-input';
import SubmitButton from '../submit-button';
import { postAuth } from '@/lib/auth-api';
import { useAuth } from '@/app/auth-context';

type RegisterMode = 'email' | 'mobile';
const OTP_RESEND_SECONDS = 30;

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [mode, setMode] = useState<RegisterMode>('email');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mobileOtpStep, setMobileOtpStep] = useState<'register' | 'verify'>('register');
  const [registeredMobile, setRegisteredMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  async function onEmailSubmit(event: FormEvent<HTMLFormElement>) {
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

  async function onMobileRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const mobile = String(form.get('mobile') ?? '');

    try {
      const result = await postAuth('register/mobile', {
        mobile,
        password: form.get('password'),
        firstName: form.get('firstName'),
        lastName: form.get('lastName'),
        termsAccepted: form.get('termsAccepted') === 'on',
        marketingConsent: form.get('marketingConsent') === 'on',
      });

      if (result.ok) {
        setRegisteredMobile(mobile);
        setOtpCode('');
        setMobileOtpStep('verify');
        setResendCountdown(OTP_RESEND_SECONDS);
        setSuccess('Verification code sent to your mobile. Enter the OTP to activate your account.');
      } else {
        setError(result.message || 'Mobile registration failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during mobile registration.');
    } finally {
      setPending(false);
    }
  }

  async function onVerifyMobileOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    const form = new FormData(event.currentTarget);

    try {
      const result = await postAuth('otp/verify', {
        mobile: registeredMobile,
        code: otpCode || form.get('code'),
      });

      if (result.ok && result.data?.accessToken) {
        setSession({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        });
        setSuccess('Mobile number verified. Welcome to Vivah Australia.');
        router.push('/member');
        router.refresh();
      } else {
        setError(result.message || 'OTP verification failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while verifying the code.');
    } finally {
      setPending(false);
    }
  }

  async function resendMobileOtp() {
    if (!registeredMobile || resendCountdown > 0) return;
    setError(null);
    setSuccess(null);
    setPending(true);

    try {
      const result = await postAuth('otp/send', { mobile: registeredMobile });
      if (result.ok) {
        setOtpCode('');
        setResendCountdown(OTP_RESEND_SECONDS);
        setSuccess('A fresh verification code has been sent to your mobile.');
      } else {
        setError(result.message || 'Could not resend the verification code.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while resending the code.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Create your free matrimonial profile"
      subtitle="Start your journey to find culturally aligned matrimonial matches in Australia."
    >
      <div className="mb-5 flex gap-2 rounded-2xl bg-[#F8E8E8]/70 p-1">
        {([
          ['email', 'Email signup'],
          ['mobile', 'Mobile signup'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
              setSuccess(null);
              if (value === 'mobile' && !registeredMobile) {
                setMobileOtpStep('register');
              }
            }}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              mode === value ? 'bg-[#7A1F2B] text-white' : 'text-[#7A1F2B] hover:bg-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'email' ? (
        <form className="grid gap-5" onSubmit={(event) => void onEmailSubmit(event)}>
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
      ) : mobileOtpStep === 'register' ? (
        <form className="grid gap-5" onSubmit={(event) => void onMobileRegister(event)}>
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
            <FormField label="Australian Mobile Number" name="mobile" type="tel" autoComplete="tel" />
            <FormField label="Password" name="password" type="password" autoComplete="new-password" />
          </div>

          <div className="rounded-2xl bg-[#FCFAF7] p-4 text-sm leading-6 text-[#6B7280]">
            We&apos;ll send a one-time verification code to your mobile after signup so you can
            activate your account immediately.
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
            <SubmitButton label="Create via Mobile" pendingLabel="Sending code..." pending={pending} />
          </div>
        </form>
      ) : (
        <form className="grid gap-5" onSubmit={(event) => void onVerifyMobileOtp(event)}>
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

          <div className="rounded-2xl bg-[#FCFAF7] p-4 text-sm leading-6 text-[#6B7280]">
            Enter the 6-digit code sent to <span className="font-semibold text-[#1A1A1A]">{registeredMobile}</span>.
          </div>

          <OtpInput disabled={pending} name="code" onChange={setOtpCode} value={otpCode} />

          <div className="grid gap-2 rounded-2xl border border-[#D4AF37]/30 bg-[#FFF8E6] p-4 text-sm text-[#7A1F2B]">
            <p className="font-semibold">Quick next step</p>
            <p>
              This code expires shortly for your safety. If it doesn&apos;t arrive, you can resend it
              once the timer finishes.
            </p>
          </div>

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <SubmitButton label="Verify & Continue" pendingLabel="Verifying..." pending={pending} />
            <button
              type="button"
              onClick={() => void resendMobileOtp()}
              disabled={pending || resendCountdown > 0}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#7A1F2B]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#7A1F2B] transition hover:bg-[#F8E8E8] disabled:opacity-60"
            >
              {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileOtpStep('register');
              setOtpCode('');
              setError(null);
              setSuccess(null);
            }}
            className="text-sm font-semibold text-[#7A1F2B] hover:text-[#651925]"
          >
            Use a different mobile number
          </button>
        </form>
      )}
    </AuthShell>
  );
}
