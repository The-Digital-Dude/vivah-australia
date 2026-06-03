'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import AuthShell from '@/app/(auth)/auth-shell';
import { postAuth } from '@/lib/auth-api';

function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Please make sure you used the correct link.');
      return;
    }

    let active = true;

    async function verify() {
      try {
        const result = await postAuth('verify-email', { token });
        if (!active) return;

        if (result.ok) {
          setStatus('success');
          setMessage('Thank you for verifying your email. Your account is now fully active.');
        } else {
          setStatus('error');
          setMessage(result.message || 'Verification failed. The token may be expired or invalid.');
        }
      } catch {
        if (!active) return;
        setStatus('error');
        setMessage('A network error occurred while verifying your email. Please try again.');
      }
    }

    void verify();

    return () => {
      active = false;
    };
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Loader2 className="size-10 animate-spin text-[#A10E4D] mb-4" />
        <p className="text-sm font-semibold text-[#2F2F2F]">{message}</p>
        <p className="text-xs text-[#6B7280] mt-2">Checking with Vivah Australia servers...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="size-16 rounded-full bg-[#FFF9F5] border border-[#D4A04C]/30 flex items-center justify-center text-[#D4A04C] mb-6 shadow-sm">
          <CheckCircle2 className="size-10" />
        </div>
        <h2 className="font-serif font-bold text-xl text-[#A10E4D] mb-3">Email Verified</h2>
        <p className="text-sm text-[#6B7280] leading-relaxed mb-8 max-w-sm">{message}</p>
        <Link
          href="/login"
          className="h-12 w-full rounded-2xl bg-[#A10E4D] px-6 text-sm font-bold text-white transition hover:bg-[#890B40] flex items-center justify-center shadow-sm"
        >
          Sign In to Your Account
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="size-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-6 border border-red-100">
        <XCircle className="size-10" />
      </div>
      <h2 className="font-serif font-bold text-xl text-red-700 mb-3">Verification Failed</h2>
      <p className="text-sm text-[#6B7280] leading-relaxed mb-8 max-w-sm">{message}</p>
      <Link
        href="/login"
        className="font-bold text-sm text-[#A10E4D] hover:text-[#890B40] underline decoration-[#A10E4D]/30 hover:decoration-[#890B40]"
      >
        Back to sign in
      </Link>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <Loader2 className="size-10 animate-spin text-[#A10E4D] mb-4" />
      <p className="text-sm font-semibold text-[#2F2F2F]">Loading verification details...</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Email Verification"
      subtitle="Complete your registration and secure your matrimonial account."
    >
      <Suspense fallback={<LoadingCard />}>
        <VerifyEmailClient />
      </Suspense>
    </AuthShell>
  );
}
