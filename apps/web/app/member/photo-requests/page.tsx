'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react';
import MemberShell from '../member-shell';
import { useMemberRequest } from '@/lib/member-api';
import {
  EmptyState,
  LoadingState,
  PremiumButton,
  PremiumCard,
  VerificationBadge,
} from '@/app/components';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RequesterProfile {
  id: string;
  displayId: string;
  firstName?: string;
  age?: number;
  city?: string;
  occupation?: string;
  verificationLevel: string;
}

interface OwnerProfile {
  id: string;
  displayId: string;
  firstName?: string;
  age?: number;
  city?: string;
  verificationLevel: string;
}

interface IncomingRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED';
  isActive: boolean;
  message: string | null;
  accessGrantedUntil: string | null;
  createdAt: string;
  respondedAt: string | null;
  requester: RequesterProfile | null;
}

interface OutgoingRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  isActive: boolean;
  accessGrantedUntil: string | null;
  createdAt: string;
  respondedAt: string | null;
  owner: OwnerProfile | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Declined',
  WITHDRAWN: 'Withdrawn',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
  WITHDRAWN: 'bg-gray-50 text-gray-500 border-gray-200',
};

function StatusBadge({ status, isActive }: { status: string; isActive?: boolean }) {
  const label = isActive ? 'Active' : (STATUS_LABELS[status] ?? status);
  const style = isActive ? 'bg-green-50 text-green-700 border-green-200' : (STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500 border-gray-200');
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${style}`}>
      {isActive && <CheckCircle2 className="size-3" />}
      {!isActive && status === 'PENDING' && <Clock className="size-3" />}
      {label}
    </span>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

// ── Incoming request card ─────────────────────────────────────────────────────

function IncomingCard({
  req,
  onRespond,
  loading,
}: {
  req: IncomingRequest;
  onRespond: (id: string, action: 'ACCEPT' | 'REJECT') => void;
  loading: boolean;
}) {
  const name = req.requester?.firstName ?? 'Member';
  const sub = [req.requester?.occupation, req.requester?.city].filter(Boolean).join(' · ');

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-[#7A1F2B]/10 bg-[#FCFAF7] p-4">
      {/* Avatar */}
      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7A1F2B] to-[#D4AF37] text-lg font-bold text-white shadow">
        {name.slice(0, 1).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-[#1A1A1A]">
            {name}
            {req.requester?.age ? `, ${req.requester.age}` : ''}
          </p>
          <VerificationBadge level={req.requester?.verificationLevel} />
          <StatusBadge status={req.status} isActive={req.isActive} />
        </div>
        {sub && <p className="mt-0.5 text-xs text-[#6B7280]">{sub}</p>}
        {req.message && (
          <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm text-[#1A1A1A] border border-[#7A1F2B]/10 italic">
            &ldquo;{req.message}&rdquo;
          </p>
        )}
        <p className="mt-1 text-xs text-[#6B7280]">Requested {timeAgo(req.createdAt)}</p>

        {req.isActive && req.accessGrantedUntil && (
          <p className="mt-1 text-xs font-semibold text-green-700">
            Access until {new Date(req.accessGrantedUntil).toLocaleDateString()}
          </p>
        )}

        {req.requester && (
          <Link
            href={`/profiles/${req.requester.id}`}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#7A1F2B] hover:underline"
          >
            View profile <ExternalLink className="size-3" />
          </Link>
        )}
      </div>

      {/* Actions — only for PENDING */}
      {req.status === 'PENDING' && (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <PremiumButton
            variant="primary"
            onClick={() => onRespond(req.id, 'ACCEPT')}
            disabled={loading}
            className="text-xs px-3 py-1.5 min-h-0"
          >
            <CheckCircle2 className="size-3.5" />
            Accept
          </PremiumButton>
          <PremiumButton
            variant="secondary"
            onClick={() => onRespond(req.id, 'REJECT')}
            disabled={loading}
            className="text-xs px-3 py-1.5 min-h-0"
          >
            <X className="size-3.5" />
            Decline
          </PremiumButton>
        </div>
      )}
    </div>
  );
}

// ── Outgoing request card ─────────────────────────────────────────────────────

function OutgoingCard({
  req,
  onWithdraw,
  loading,
}: {
  req: OutgoingRequest;
  onWithdraw: (id: string) => void;
  loading: boolean;
}) {
  const name = req.owner?.firstName ?? 'Member';

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-[#7A1F2B]/10 bg-[#FCFAF7] p-4">
      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7A1F2B] to-[#D4AF37] text-lg font-bold text-white shadow">
        {name.slice(0, 1).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-[#1A1A1A]">
            {name}
            {req.owner?.age ? `, ${req.owner.age}` : ''}
          </p>
          {req.owner && <VerificationBadge level={req.owner.verificationLevel} />}
          <StatusBadge status={req.status} isActive={req.isActive} />
        </div>
        {req.owner?.city && <p className="mt-0.5 text-xs text-[#6B7280]">{req.owner.city}</p>}
        <p className="mt-1 text-xs text-[#6B7280]">Sent {timeAgo(req.createdAt)}</p>

        {req.isActive && req.accessGrantedUntil && (
          <p className="mt-1 text-xs font-semibold text-green-700">
            Photo access until {new Date(req.accessGrantedUntil).toLocaleDateString()}
          </p>
        )}

        {req.owner && (
          <Link
            href={`/profiles/${req.owner.id}`}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#7A1F2B] hover:underline"
          >
            View profile <ExternalLink className="size-3" />
          </Link>
        )}
      </div>

      {req.status === 'PENDING' && (
        <PremiumButton
          variant="secondary"
          onClick={() => onWithdraw(req.id)}
          disabled={loading}
          className="shrink-0 text-xs px-3 py-1.5 min-h-0"
        >
          <X className="size-3.5" />
          Withdraw
        </PremiumButton>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PhotoRequestsPage() {
  const memberRequest = useMemberRequest();

  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  async function loadData() {
    setLoading(true);
    try {
      const [inRes, outRes] = await Promise.all([
        memberRequest('/api/me/photo-requests/incoming'),
        memberRequest('/api/me/photo-requests'),
      ]);
      if (inRes.ok) setIncoming((inRes.data as { requests: IncomingRequest[] }).requests ?? []);
      if (outRes.ok) setOutgoing((outRes.data as { requests: OutgoingRequest[] }).requests ?? []);
    } catch {
      setError('Failed to load photo requests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [memberRequest]);

  async function handleRespond(requestId: string, action: 'ACCEPT' | 'REJECT') {
    setActionLoading(true);
    try {
      await memberRequest(`/api/me/photo-requests/${requestId}`, {
        method: 'PATCH',
        body: { action },
      });
      await loadData();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWithdraw(requestId: string) {
    setActionLoading(true);
    try {
      await memberRequest(`/api/me/photo-requests/${requestId}`, { method: 'DELETE' });
      await loadData();
    } finally {
      setActionLoading(false);
    }
  }

  const pendingIncoming = incoming.filter((r) => r.status === 'PENDING').length;

  return (
    <MemberShell title="Photo Requests" subtitle="Manage private photo access">
      {loading ? (
        <LoadingState label="Loading photo requests" />
      ) : error ? (
        <p className="rounded-2xl bg-[#F8E8E8] p-4 text-sm font-semibold text-[#7A1F2B]">{error}</p>
      ) : (
        <div className="space-y-6">
          {/* Summary banner */}
          {pendingIncoming > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#FFFBEB] to-[#FDF6F0] px-5 py-4">
              <Camera className="size-5 shrink-0 text-[#D4AF37]" />
              <p className="text-sm font-semibold text-[#1A1A1A]">
                You have{' '}
                <span className="text-[#7A1F2B]">{pendingIncoming} pending</span> photo access{' '}
                {pendingIncoming === 1 ? 'request' : 'requests'} to review.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 rounded-2xl border border-[#7A1F2B]/10 bg-[#FCFAF7] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('incoming')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'incoming'
                  ? 'bg-[#7A1F2B] text-white shadow'
                  : 'text-[#6B7280] hover:text-[#7A1F2B]'
              }`}
            >
              Received{pendingIncoming > 0 ? ` (${pendingIncoming})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('outgoing')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'outgoing'
                  ? 'bg-[#7A1F2B] text-white shadow'
                  : 'text-[#6B7280] hover:text-[#7A1F2B]'
              }`}
            >
              Sent ({outgoing.length})
            </button>
          </div>

          {/* Content */}
          <PremiumCard className="p-0 overflow-hidden">
            <div className="divide-y divide-[#7A1F2B]/5">
              {activeTab === 'incoming' ? (
                incoming.length === 0 ? (
                  <div className="p-6">
                    <EmptyState title="No requests received yet">
                      When members request access to your private photos, they&apos;ll appear here.
                    </EmptyState>
                  </div>
                ) : (
                  incoming.map((req) => (
                    <div key={req.id} className="p-4">
                      <IncomingCard
                        req={req}
                        onRespond={(id, action) => void handleRespond(id, action)}
                        loading={actionLoading}
                      />
                    </div>
                  ))
                )
              ) : outgoing.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No requests sent"
                    action={
                      <PremiumButton href="/member/matches" variant="secondary">
                        Browse profiles
                      </PremiumButton>
                    }
                  >
                    Visit a member profile and request access to their private gallery.
                  </EmptyState>
                </div>
              ) : (
                outgoing.map((req) => (
                  <div key={req.id} className="p-4">
                    <OutgoingCard
                      req={req}
                      onWithdraw={(id) => void handleWithdraw(id)}
                      loading={actionLoading}
                    />
                  </div>
                ))
              )}
            </div>
          </PremiumCard>

          {/* Upload tip */}
          <p className="text-xs text-center text-[#6B7280]">
            To add private photos for others to request access to, go to{' '}
            <Link href="/member/media" className="font-semibold text-[#7A1F2B] hover:underline">
              Media uploads
            </Link>{' '}
            and set the visibility to Private.
          </p>
        </div>
      )}
    </MemberShell>
  );
}
