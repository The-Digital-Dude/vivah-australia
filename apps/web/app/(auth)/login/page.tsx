'use client';

import { useState, type FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { appleAuthHelpers } from 'react-apple-signin-auth';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import AuthShell from '../auth-shell';
import SubmitButton from '../submit-button';
import { postAuth, type AuthSessionUser } from '@/lib/auth-api';
import { memberRequest } from '@/lib/member-api';
import { useAuth } from '@/app/auth-context';

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}

function safeReturnUrl(value: string | null, fallback: string) {
  if (!value || !value.startsWith('/')) {
    return fallback;
  }
  return value;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts Australian / international mobile numbers: optional +, spaces, dashes
// and parentheses, requiring at least 8 digits.
const MOBILE_PATTERN = /^\+?[\d\s()-]{8,}$/;

function validateIdentifier(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Email address or mobile number is required.';
  }
  if (trimmed.includes('@')) {
    return EMAIL_PATTERN.test(trimmed) ? '' : 'Enter a valid email address.';
  }
  const digitCount = trimmed.replace(/\D/g, '').length;
  if (MOBILE_PATTERN.test(trimmed) && digitCount >= 8) {
    return '';
  }
  return 'Enter a valid email address or mobile number.';
}

function validatePassword(value: string): string {
  if (!value) {
    return 'Password is required.';
  }
  return '';
}

interface MemberProfileSummary {
  completionPercentage?: number;
}

interface FacebookAuthResponse {
  accessToken?: unknown;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });

  function runValidation(field: 'email' | 'password', value: string) {
    return field === 'email' ? validateIdentifier(value) : validatePassword(value);
  }

  function handleFieldChange(field: 'email' | 'password', value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Only surface errors live once the field has been touched (blurred or
    // attempted submit) so we don't yell at the user mid-typing.
    if (touched[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: runValidation(field, value) }));
    }
  }

  function handleFieldBlur(field: 'email' | 'password') {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: runValidation(field, values[field]) }));
  }

  function applySession(
    user: AuthSessionUser | undefined,
    accessToken?: string,
    refreshToken?: string,
  ) {
    setSession({ user, accessToken, refreshToken });
    // In cross-origin deployments (Vercel + Render) the httpOnly cookie lives on
    // the API domain and is invisible to the Next.js middleware running on the web
    // domain.  Set a same-domain accessToken cookie here so the middleware can
    // gate /member and /admin routes correctly.  The real security check is still
    // the API's requireAuth — this cookie is only used for client-side routing.
    if (accessToken && typeof document !== 'undefined') {
      document.cookie = `accessToken=${accessToken}; path=/; max-age=900; SameSite=Lax; Secure`;
    }
  }

  async function handleGoogleSuccess(tokenResponse: { access_token: string }) {
    setError('');
    setMessage('');
    setPending(true);
    try {
      const result = await postAuth('oauth/google', { token: tokenResponse.access_token });
      if (result.ok) {
        applySession(result.data?.user, result.data?.accessToken, result.data?.refreshToken);
        setMessage('Signed in successfully.');
        await routeAfterLogin(result.data?.accessToken);
      } else {
        setError(result.message || 'Google login failed');
        setPending(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during Google login');
      setPending(false);
    }
  }

  const routeAfterLogin = async (accessToken?: string) => {
    const requestedReturnUrl = searchParams.get('redirect') || searchParams.get('returnUrl');
    let returnUrl = safeReturnUrl(requestedReturnUrl, '/member');

    if (requestedReturnUrl) {
      window.location.href = returnUrl;
      return;
    }

    try {
      // Use Authorization header so the check works cross-origin (Vercel → Render).
      // Race against a 5 s timeout to avoid hanging during Render cold starts.
      const timeout = new Promise<{ ok: false; message: string; data?: never }>((resolve) =>
        setTimeout(() => resolve({ ok: false, message: 'timeout' }), 5000),
      );
      const profileRes = await Promise.race([
        memberRequest('/api/me/profile', ...(accessToken ? [{ token: accessToken }] : [])),
        timeout,
      ]);
      const profile = (profileRes.data as { profile?: MemberProfileSummary } | undefined)?.profile;
      if (profileRes.ok && (profile?.completionPercentage ?? 100) < 50) {
        returnUrl = '/member/onboarding';
      }
    } catch {
      // Ignore errors and use default returnUrl
    }

    window.location.href = returnUrl;
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      void handleGoogleSuccess(tokenResponse);
    },
    onError: () => {
      setError('Google login failed');
      setPending(false);
    },
  });

  const handleAppleSignIn = async () => {
    setError('');
    setMessage('');
    setPending(true);
    try {
      const response = await appleAuthHelpers.signIn({
        authOptions: {
          clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || 'missing-client-id',
          scope: 'email name',
          redirectURI: typeof window !== 'undefined' ? `${window.location.origin}/login` : '',
          usePopup: true,
        },
      });
      if (response?.authorization?.id_token) {
        const result = await postAuth('oauth/apple', { token: response?.authorization?.id_token });
        if (result.ok) {
          applySession(result.data?.user, result.data?.accessToken, result.data?.refreshToken);
          setMessage('Signed in successfully.');
          await routeAfterLogin(result.data?.accessToken);
        } else {
          setError(result.message || 'Apple login failed');
          setPending(false);
        }
      } else {
        throw new Error('No Apple token received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during Apple login');
      setPending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const form = new FormData(event.currentTarget);
    const email = formValue(form, 'email');
    const password = formValue(form, 'password');

    const nextErrors = {
      email: validateIdentifier(email),
      password: validatePassword(password),
    };
    setTouched({ email: true, password: true });
    setFieldErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setPending(true);

    try {
      const result = await postAuth('login', { email, password });

      if (result.ok) {
        applySession(result.data?.user, result.data?.accessToken, result.data?.refreshToken);
        setMessage('Welcome back');
        await routeAfterLogin(result.data?.accessToken);
      } else {
        setError(result.message || 'Login failed');
        setPending(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during login');
      setPending(false);
    }
  };

  const responseFacebook = async (response: unknown) => {
    const accessToken =
      typeof response === 'object' &&
      response !== null &&
      'accessToken' in response &&
      typeof (response as FacebookAuthResponse).accessToken === 'string'
        ? (response as { accessToken: string }).accessToken
        : null;

    if (!accessToken) {
      setError('Facebook login failed or was cancelled');
      setPending(false);
      return;
    }

    setError('');
    setMessage('');
    setPending(true);

    try {
      const result = await postAuth('oauth/facebook', { token: accessToken });

      if (result.ok) {
        applySession(result.data?.user, result.data?.accessToken, result.data?.refreshToken);
        setMessage('Signed in successfully.');
        await routeAfterLogin(result.data?.accessToken);
      } else {
        setError(result.message || 'Facebook login failed');
        setPending(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during Facebook login');
      setPending(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back to Vivah Australia"
      subtitle="Sign in to your Vivah Australia account to discover your perfect match."
    >
      <form method="post" className="grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-sm font-semibold text-green-700">
            {message}
          </div>
        )}

        <div className="grid gap-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-bold text-brand-charcoal">
              Email Address or Mobile Number
            </label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              value={values.email}
              onChange={(event) => handleFieldChange('email', event.target.value)}
              onBlur={() => handleFieldBlur('email')}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              className={`h-12 w-full rounded-2xl border bg-white px-4 text-brand-charcoal placeholder-[#6B7280] outline-none transition focus:ring-4 text-sm ${
                fieldErrors.email
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-[#A10E4D]/20 focus:border-[#A10E4D] focus:ring-[#FFF0F3]'
              }`}
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1.5 text-xs font-semibold text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="text-sm font-bold text-brand-charcoal">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-brand-maroon hover:text-[#890B40]"
              >
                Forgot your password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => handleFieldChange('password', event.target.value)}
              onBlur={() => handleFieldBlur('password')}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              className={`h-12 w-full rounded-2xl border bg-white px-4 text-brand-charcoal placeholder-[#6B7280] outline-none transition focus:ring-4 text-sm ${
                fieldErrors.password
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-[#A10E4D]/20 focus:border-[#A10E4D] focus:ring-[#FFF0F3]'
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p id="password-error" className="mt-1.5 text-xs font-semibold text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>
        </div>

        <div className="mt-2">
          <SubmitButton label="Sign In" pendingLabel="Signing in..." pending={pending} />
        </div>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-brand-maroon/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-brand-ivory px-2 text-[#5F5F5F] font-semibold">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                void googleLogin();
              }}
              className="flex h-11 items-center justify-center gap-1 rounded-2xl border border-brand-maroon/10 bg-white px-2 text-sm font-semibold text-brand-charcoal hover:bg-brand-maroon/5 transition"
            >
            Google
          </button>
          <button
            type="button"
            onClick={() => void handleAppleSignIn()}
            className="flex h-11 items-center justify-center gap-1 rounded-2xl border border-brand-maroon/10 bg-white px-2 text-sm font-semibold text-brand-charcoal hover:bg-brand-maroon/5 transition"
          >
            Apple
          </button>
          <FacebookLogin
            appId={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || 'missing-app-id'}
            autoLoad={false}
            fields="name,email,picture"
            callback={(response) => {
              void responseFacebook(response);
            }}
            render={(renderProps) => (
              <button
                type="button"
                onClick={() => renderProps.onClick?.()}
                className="flex h-11 items-center justify-center gap-1 rounded-2xl border border-brand-maroon/10 bg-white px-2 text-sm font-semibold text-brand-charcoal hover:bg-brand-maroon/5 transition"
              >
                Facebook
              </button>
            )}
          />
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-[#6B7280]">
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-brand-maroon hover:text-[#890B40]">
              Create free profile
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthShell title="Loading..." subtitle="Please wait...">
        <div className="flex justify-center p-8">Loading...</div>
      </AuthShell>
    }>
      <LoginContent />
    </Suspense>
  );
}
