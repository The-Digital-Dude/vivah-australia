'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell from '../auth-shell';
import FormField from '../form-field';
import OtpInput from '../otp-input';
import SubmitButton from '../submit-button';
import { postAuth, type AuthSessionUser } from '@/lib/auth-api';
import { useAuth } from '@/app/auth-context';

type RegisterMode = 'email' | 'mobile';
const OTP_RESEND_SECONDS = 30;

type RegisterField = 'firstName' | 'lastName' | 'email' | 'mobile' | 'password';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mirrors the server-side australianMobileSchema in @vivah/shared.
const AU_MOBILE_PATTERN = /^(\+?61|0)4\d{8}$/;

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}

// Mirrors the server-side passwordSchema in @vivah/shared so the user sees the
// requirement before submitting rather than after a round-trip.
function validatePassword(value: string): string {
  if (!value) return 'Password is required.';
  if (value.length < 12) return 'Password must be at least 12 characters.';
  if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter.';
  if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter.';
  if (!/[0-9]/.test(value)) return 'Password must include a number.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include a symbol.';
  return '';
}

function validateField(field: RegisterField, value: string): string {
  const trimmed = value.trim();
  switch (field) {
    case 'firstName':
      return trimmed ? '' : 'First name is required.';
    case 'lastName':
      return trimmed ? '' : 'Last name is required.';
    case 'email':
      if (!trimmed) return 'Email is required.';
      return EMAIL_PATTERN.test(trimmed) ? '' : 'Enter a valid email address.';
    case 'mobile':
      if (!trimmed) return 'Mobile number is required.';
      return AU_MOBILE_PATTERN.test(trimmed)
        ? ''
        : 'Enter a valid Australian mobile number (e.g. +61412345678).';
    case 'password':
      return validatePassword(value);
    default:
      return '';
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [mode, setMode] = useState<RegisterMode>('email');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [emailStep, setEmailStep] = useState<'register' | 'verify'>('register');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [mobileOtpStep, setMobileOtpStep] = useState<'register' | 'verify'>('register');
  const [registeredMobile, setRegisteredMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterField, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<RegisterField, boolean>>>({});
  const [termsError, setTermsError] = useState('');

  function handleFieldChange(field: RegisterField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Only surface errors live once the field has been touched so we don't yell
    // at the user mid-typing on first entry.
    if (touched[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  }

  function handleFieldBlur(field: RegisterField) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, values[field]) }));
  }

  function applySession(
    user: AuthSessionUser | undefined,
    accessToken?: string,
    refreshToken?: string,
  ) {
    setSession({ user, accessToken, refreshToken });
  }

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

    const form = new FormData(event.currentTarget);
    const firstName = formValue(form, 'firstName');
    const lastName = formValue(form, 'lastName');
    const email = formValue(form, 'email');
    const password = formValue(form, 'password');
    const termsAccepted = form.get('termsAccepted') === 'on';

    const nextErrors = {
      firstName: validateField('firstName', firstName),
      lastName: validateField('lastName', lastName),
      email: validateField('email', email),
      password: validateField('password', password),
    };
    const nextTermsError = termsAccepted
      ? ''
      : 'You must accept the Terms of Use and Privacy Policy.';
    setTouched((prev) => ({ ...prev, firstName: true, lastName: true, email: true, password: true }));
    setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
    setTermsError(nextTermsError);
    if (Object.values(nextErrors).some(Boolean) || nextTermsError) {
      return;
    }

    setPending(true);

    try {
      const result = await postAuth('register/email', {
        email,
        password,
        firstName,
        lastName,
        termsAccepted,
        marketingConsent: form.get('marketingConsent') === 'on',
      });

      if (result.ok) {
        setRegisteredEmail(email);
        setEmailStep('verify');
        setResendCountdown(OTP_RESEND_SECONDS);
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

  async function resendVerificationEmail() {
    if (!registeredEmail || resendCountdown > 0) return;
    setError(null);
    setSuccess(null);
    setPending(true);

    try {
      const result = await postAuth('resend-verification-email', { email: registeredEmail });
      if (result.ok) {
        setResendCountdown(OTP_RESEND_SECONDS);
        setSuccess('A fresh verification link has been sent to your email.');
      } else {
        setError(result.message || 'Could not resend the verification email.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while resending the email.');
    } finally {
      setPending(false);
    }
  }

  async function onMobileRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const firstName = formValue(form, 'firstName');
    const lastName = formValue(form, 'lastName');
    const mobile = formValue(form, 'mobile');
    const password = formValue(form, 'password');
    const termsAccepted = form.get('termsAccepted') === 'on';

    const nextErrors = {
      firstName: validateField('firstName', firstName),
      lastName: validateField('lastName', lastName),
      mobile: validateField('mobile', mobile),
      password: validateField('password', password),
    };
    const nextTermsError = termsAccepted
      ? ''
      : 'You must accept the Terms of Use and Privacy Policy.';
    setTouched((prev) => ({ ...prev, firstName: true, lastName: true, mobile: true, password: true }));
    setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
    setTermsError(nextTermsError);
    if (Object.values(nextErrors).some(Boolean) || nextTermsError) {
      return;
    }

    setPending(true);

    try {
      const result = await postAuth('register/mobile', {
        mobile,
        password,
        firstName,
        lastName,
        termsAccepted,
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
        applySession(result.data.user, result.data.accessToken, result.data.refreshToken);
        setSuccess('Mobile number verified. Welcome to Vivah Australia.');
        router.push('/member/onboarding');
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
      <div className="mb-5 flex gap-2 rounded-2xl bg-brand-maroon/8 p-1">
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
              setFieldErrors({});
              setTouched({});
              setTermsError('');
              if (value === 'mobile' && !registeredMobile) {
                setMobileOtpStep('register');
              }
            }}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              mode === value ? 'bg-brand-maroon text-white' : 'text-brand-maroon hover:bg-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'email' && emailStep === 'register' ? (
        <form method="post" className="grid gap-5" onSubmit={(event) => void onEmailSubmit(event)}>
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
              <FormField
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                value={values.firstName}
                onChange={(value) => handleFieldChange('firstName', value)}
                onBlur={() => handleFieldBlur('firstName')}
                error={fieldErrors.firstName}
              />
              <FormField
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                value={values.lastName}
                onChange={(value) => handleFieldChange('lastName', value)}
                onBlur={() => handleFieldBlur('lastName')}
                error={fieldErrors.lastName}
              />
            </div>
            <FormField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(value) => handleFieldChange('email', value)}
              onBlur={() => handleFieldBlur('email')}
              error={fieldErrors.email}
            />
            <FormField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(value) => handleFieldChange('password', value)}
              onBlur={() => handleFieldBlur('password')}
              error={fieldErrors.password}
            />
          </div>

          <div className="grid gap-3">
            <label className="flex items-start gap-3 text-xs leading-relaxed text-gray-500 select-none cursor-pointer">
              <input
                name="termsAccepted"
                type="checkbox"
                onChange={() => setTermsError('')}
                className="mt-0.5 size-4 accent-brand-maroon rounded border-brand-maroon/20"
              />
              <span>
                I accept the{' '}
                <Link href="/terms" className="font-bold text-brand-maroon hover:underline">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-bold text-brand-maroon hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {termsError && <p className="text-xs font-semibold text-red-600">{termsError}</p>}

            <label className="flex items-start gap-3 text-xs leading-relaxed text-gray-500 select-none cursor-pointer">
              <input
                name="marketingConsent"
                type="checkbox"
                className="mt-0.5 size-4 accent-brand-maroon rounded border-brand-maroon/20"
              />
              <span>Send me product updates, premium discounts, and matchmaking tips.</span>
            </label>
          </div>

          <div className="mt-2">
            <SubmitButton label="Create Free Profile" pendingLabel="Creating..." pending={pending} />
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              Already registered?{' '}
              <Link href="/login" className="font-bold text-brand-maroon hover:text-[#890B40]">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      ) : mode === 'email' && emailStep === 'verify' ? (
        <div className="grid gap-5">
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

          <div className="rounded-2xl bg-brand-ivory p-4 text-sm leading-6 text-gray-500">
            A verification link was sent to <span className="font-semibold text-brand-charcoal">{registeredEmail}</span>.
            Please click the link in the email to activate your account.
          </div>

          <div className="mt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void resendVerificationEmail()}
              disabled={pending || resendCountdown > 0}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-brand-maroon/20 bg-white px-5 py-2.5 text-sm font-semibold text-brand-maroon transition hover:bg-brand-maroon/5 disabled:opacity-60"
            >
              {resendCountdown > 0 ? `Resend Link in ${resendCountdown}s` : 'Resend Verification Email'}
            </button>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setEmailStep('register');
                setRegisteredEmail('');
                setError(null);
                setSuccess(null);
              }}
              className="text-sm font-semibold text-brand-maroon hover:text-[#890B40]"
            >
              Use a different email address
            </button>
          </div>
        </div>
      ) : mobileOtpStep === 'register' ? (
        <form method="post" className="grid gap-5" onSubmit={(event) => void onMobileRegister(event)}>
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
              <FormField
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                value={values.firstName}
                onChange={(value) => handleFieldChange('firstName', value)}
                onBlur={() => handleFieldBlur('firstName')}
                error={fieldErrors.firstName}
              />
              <FormField
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                value={values.lastName}
                onChange={(value) => handleFieldChange('lastName', value)}
                onBlur={() => handleFieldBlur('lastName')}
                error={fieldErrors.lastName}
              />
            </div>
            <FormField
              label="Australian Mobile Number"
              name="mobile"
              type="tel"
              autoComplete="tel"
              value={values.mobile}
              onChange={(value) => handleFieldChange('mobile', value)}
              onBlur={() => handleFieldBlur('mobile')}
              error={fieldErrors.mobile}
            />
            <FormField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(value) => handleFieldChange('password', value)}
              onBlur={() => handleFieldBlur('password')}
              error={fieldErrors.password}
            />
          </div>

          <div className="rounded-2xl bg-brand-ivory p-4 text-sm leading-6 text-gray-500">
            We&apos;ll send a one-time verification code to your mobile after signup so you can
            activate your account immediately.
          </div>

          <div className="grid gap-3">
            <label className="flex items-start gap-3 text-xs leading-relaxed text-gray-500 select-none cursor-pointer">
              <input
                name="termsAccepted"
                type="checkbox"
                onChange={() => setTermsError('')}
                className="mt-0.5 size-4 accent-brand-maroon rounded border-brand-maroon/20"
              />
              <span>
                I accept the{' '}
                <Link href="/terms" className="font-bold text-brand-maroon hover:underline">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-bold text-brand-maroon hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {termsError && <p className="text-xs font-semibold text-red-600">{termsError}</p>}

            <label className="flex items-start gap-3 text-xs leading-relaxed text-gray-500 select-none cursor-pointer">
              <input
                name="marketingConsent"
                type="checkbox"
                className="mt-0.5 size-4 accent-brand-maroon rounded border-brand-maroon/20"
              />
              <span>Send me product updates, premium discounts, and matchmaking tips.</span>
            </label>
          </div>

          <div className="mt-2">
            <SubmitButton label="Create via Mobile" pendingLabel="Sending code..." pending={pending} />
          </div>
        </form>
      ) : (
        <form method="post" className="grid gap-5" onSubmit={(event) => void onVerifyMobileOtp(event)}>
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

          <div className="rounded-2xl bg-brand-ivory p-4 text-sm leading-6 text-gray-500">
            Enter the 6-digit code sent to <span className="font-semibold text-brand-charcoal">{registeredMobile}</span>.
          </div>

          <OtpInput disabled={pending} name="code" onChange={setOtpCode} value={otpCode} />

          <div className="grid gap-2 rounded-2xl border border-brand-gold/30 bg-brand-gold/10 p-4 text-sm text-brand-maroon">
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
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-brand-maroon/20 bg-white px-5 py-2.5 text-sm font-semibold text-brand-maroon transition hover:bg-brand-maroon/5 disabled:opacity-60"
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
            className="text-sm font-semibold text-brand-maroon hover:text-[#890B40]"
          >
            Use a different mobile number
          </button>
        </form>
      )}
    </AuthShell>
  );
}
