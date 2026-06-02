'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import { useMemberRequest } from '@/lib/member-api';
import MemberShell from '../member-shell';

export default function MemberProfileRedirectPage() {
  const router = useRouter();
  const { initialized, token } = useAuth();
  const memberRequest = useMemberRequest();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !token) {
      router.replace('/login');
      return;
    }

    if (!initialized || !token) {
      return;
    }

    async function loadOwnProfile() {
      const result = await memberRequest('/api/me/profile');
      if (result.ok && result.data) {
        interface ProfileData {
          id?: string;
          displayId?: string;
          slug?: string;
        }
        const profile = (result.data as { profile?: ProfileData }).profile;
        const identifier = profile?.slug || profile?.displayId || profile?.id;
        if (identifier) {
          router.replace(`/profiles/${identifier}`);
        } else {
          setError('Could not locate your profile identifier.');
        }
      } else {
        setError(result.message || 'Failed to load your profile.');
      }
    }

    void loadOwnProfile();
  }, [initialized, token, memberRequest, router]);

  return (
    <MemberShell title="Loading Profile..." subtitle="Redirecting to your public profile view...">
      <div className="flex min-h-[200px] items-center justify-center">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#7A1F2B] border-t-transparent" />
            <span className="text-sm font-semibold text-[#6B7280]">Loading details...</span>
          </div>
        )}
      </div>
    </MemberShell>
  );
}
