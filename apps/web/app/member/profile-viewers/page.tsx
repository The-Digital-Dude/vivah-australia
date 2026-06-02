'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Eye, Lock, Crown, ShieldCheck, Clock, ChevronRight, Loader2 } from 'lucide-react';
import MemberShell from '../member-shell';
import { useMemberRequest } from '@/lib/member-api';
import { PremiumCard, PremiumButton, VerificationBadge, EmptyState } from '@/app/components';

// ── Types ────────────────────────────────────────────────────────────────────

interface ViewerEntry {
  viewedAt: string;
  blurred: boolean;
  viewer: {
    id: string | null;
    displayId: string | null;
    firstName: string | null;
    age?: number;
    city?: string;
    state?: string;
    occupation?: string;
    religion?: string;
    verificationLevel: string;
    photoUrl?: string | null;
  } | null;
}

interface ProfileViewersResponse {
  total: number;
  isPaid: boolean;
  viewers: ViewerEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Viewer Card ───────────────────────────────────────────────────────────────

function ViewerCard({ entry }: { entry: ViewerEntry }) {
  const { viewer, viewedAt, blurred } = entry;

  if (blurred || !viewer?.id) {
    // Free-tier: blurred card
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#7A1F2B]/10 bg-white p-4 shadow-sm">
        {/* blur overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/80 backdrop-blur-sm">
          <Lock className="size-5 text-[#7A1F2B]" />
          <p className="text-xs font-semibold text-[#7A1F2B]">Upgrade to see who this is</p>
          <Link
            href="/member/subscription"
            className="rounded-full bg-[#7A1F2B] px-3 py-1 text-xs font-bold text-white hover:bg-[#651925] transition"
          >
            Upgrade Now
          </Link>
        </div>

        {/* Blurred content behind */}
        <div className="flex items-center gap-3 select-none pointer-events-none">
          <div className="size-12 rounded-full bg-[#F3E8E9] flex items-center justify-center text-[#7A1F2B] font-bold text-lg">
            ?
          </div>
          <div className="flex-1 min-w-0">
            <p className="h-4 w-24 rounded bg-[#7A1F2B]/10 mb-1" />
            <p className="h-3 w-32 rounded bg-[#7A1F2B]/5" />
          </div>
          <span className="text-[10px] text-neutral-400">{timeAgo(viewedAt)}</span>
        </div>
      </div>
    );
  }

  const profileHref = `/profiles/${viewer.id}`;
  const displayName = viewer.firstName ?? viewer.displayId ?? 'Member';
  const subtitle = [viewer.occupation, viewer.city ?? viewer.state]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={profileHref}
      className="group flex items-center gap-3 rounded-2xl border border-[#7A1F2B]/10 bg-white p-4 shadow-sm hover:border-[#7A1F2B]/30 hover:shadow-md transition-all"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {viewer.photoUrl ? (
          <Image
            src={viewer.photoUrl}
            alt={displayName}
            width={56}
            height={56}
            className="size-14 rounded-full object-cover border-2 border-[#7A1F2B]/10 group-hover:border-[#7A1F2B]/30 transition"
          />
        ) : (
          <div className="size-14 rounded-full bg-gradient-to-br from-[#F3E8E9] to-[#FDF6F0] border-2 border-[#7A1F2B]/10 flex items-center justify-center">
            <span className="text-xl font-bold text-[#7A1F2B]">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Verification dot */}
        {viewer.verificationLevel !== 'NONE' && (
          <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-[#4CAF50] border-2 border-white flex items-center justify-center">
            <ShieldCheck className="size-2.5 text-white" />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[#1A1A1A] group-hover:text-[#7A1F2B] transition truncate">
            {displayName}
            {viewer.age ? `, ${viewer.age}` : ''}
          </p>
          <VerificationBadge level={viewer.verificationLevel} />
        </div>
        {subtitle && (
          <p className="text-xs text-[#6B7280] mt-0.5 truncate">{subtitle}</p>
        )}
        {viewer.religion && (
          <p className="text-xs text-[#7A1F2B]/60 mt-0.5 truncate">{viewer.religion}</p>
        )}
      </div>

      {/* Time + arrow */}
      <div className="shrink-0 flex flex-col items-end gap-1 text-right">
        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
          <Clock className="size-3" />
          {timeAgo(viewedAt)}
        </span>
        <ChevronRight className="size-4 text-[#7A1F2B]/30 group-hover:text-[#7A1F2B] transition" />
      </div>
    </Link>
  );
}

// ── Free upgrade banner ───────────────────────────────────────────────────────

function FreeUpgradeBanner({ total, shown }: { total: number; shown: number }) {
  const hidden = total - shown;
  if (hidden <= 0) return null;

  return (
    <div className="rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#FFFBEB] to-[#FDF6E3] p-5 text-center shadow-sm">
      <Crown className="mx-auto size-8 text-[#D4AF37] mb-2" />
      <p className="font-bold text-[#1A1A1A] text-lg">
        {hidden} more {hidden === 1 ? 'person' : 'people'} viewed your profile
      </p>
      <p className="text-sm text-[#6B7280] mt-1 mb-4">
        Upgrade to Premium to see who they are and connect with them.
      </p>
      <Link href="/member/subscription">
        <PremiumButton>
          <Crown className="size-4 mr-2" />
          Upgrade to See All Viewers
        </PremiumButton>
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfileViewersPage() {
  const memberRequest = useMemberRequest();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileViewersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void memberRequest('/api/me/profile-viewers').then((result) => {
      if (result.ok) {
        setData(result.data as ProfileViewersResponse);
      } else {
        setError(result.message);
      }
      setLoading(false);
    });
  }, [memberRequest]);

  if (loading) {
    return (
      <MemberShell title="Who Viewed My Profile" subtitle="">
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#7A1F2B]" />
        </div>
      </MemberShell>
    );
  }

  return (
    <MemberShell
      title="Who Viewed My Profile"
      subtitle="See who has been interested in your profile recently."
    >
      {error ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}

      {/* Summary stat banner */}
      {data && (
        <PremiumCard className="mb-6 flex items-center gap-4 p-5 bg-gradient-to-br from-[#7A1F2B] to-[#651925] text-white">
          <div className="rounded-2xl bg-white/15 p-3">
            <Eye className="size-7 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-3xl font-bold">{data.total}</p>
            <p className="text-sm text-white/70">
              {data.total === 1 ? 'person has' : 'people have'} viewed your profile
            </p>
          </div>
          {!data.isPaid && (
            <Link href="/member/subscription" className="ml-auto shrink-0">
              <span className="flex items-center gap-1.5 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#1A1A1A] hover:bg-[#C4A030] transition">
                <Crown className="size-3.5" />
                Upgrade
              </span>
            </Link>
          )}
        </PremiumCard>
      )}

      {/* Viewer list */}
      {data?.viewers && data.viewers.length > 0 ? (
        <div className="space-y-3">
          {data.viewers.map((entry, index) => (
            <ViewerCard
              key={`${entry.viewer?.id ?? 'blurred'}-${index}`}
              entry={entry}
            />
          ))}

          {/* Upgrade banner if there are hidden viewers */}
          {!data.isPaid && (
            <FreeUpgradeBanner total={data.total} shown={data.viewers.length} />
          )}
        </div>
      ) : (
        !loading && (
          <EmptyState
            title="No views yet"
            action={
              <Link href="/member/profile/edit">
                <PremiumButton variant="secondary">Complete Your Profile</PremiumButton>
              </Link>
            }
          >
            When members view your profile, they&apos;ll appear here. Make sure your profile is
            complete and submitted for approval to show up in search results.
          </EmptyState>
        )
      )}
    </MemberShell>
  );
}
