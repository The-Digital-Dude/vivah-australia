'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, AlertTriangle, ExternalLink, Ban } from 'lucide-react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminStatusBadge } from '../components/admin-status-badge';

interface FraudEvent {
  _id: string;
  userId?: string;
  rule: string;
  ruleLabel?: string;
  severity: string;
  status: string;
  score: number;
  metadata?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
  reviewReason?: string;
  affectedMember?: {
    id?: string;
    email?: string;
    status?: string;
    profile?: { firstName?: string; displayId?: string; city?: string; state?: string } | null;
  } | null;
  createdAt: string;
}

interface FraudStatusCounts {
  OPEN: number;
  REVIEWED: number;
  DISMISSED: number;
}

interface FraudRuleOption {
  rule: string;
  label: string;
}

type StatusFilter = 'OPEN' | 'REVIEWED' | 'DISMISSED' | 'ALL';

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'OPEN', label: 'Open' },
  { key: 'REVIEWED', label: 'Reviewed' },
  { key: 'DISMISSED', label: 'Dismissed' },
  { key: 'ALL', label: 'All' },
];

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-rose-100 border-rose-300 text-rose-900',
  HIGH: 'bg-orange-50 border-orange-250 text-orange-900',
  MEDIUM: 'bg-amber-50 border-amber-250 text-amber-900',
  LOW: 'bg-neutral-100 border-neutral-250 text-neutral-700',
};

const METADATA_LABELS: Record<string, string> = {
  window: 'Time window',
  viewCount: 'Profile views',
  reportCount: 'Reports submitted',
  targetId: 'Target member',
  email: 'Email',
  phone: 'Phone',
  count: 'Attempts',
  messageCount: 'Messages sent',
  mobile: 'Mobile',
  attempts: 'Attempts',
  activeReportCount: 'Active reports',
  highestSeverity: 'Highest severity',
  statuses: 'Report statuses',
};

const WINDOW_LABELS: Record<string, string> = {
  '1h': 'Last hour',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
};

function humanizeKey(key: string) {
  const known = METADATA_LABELS[key];
  if (known) return known;
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function MetadataGrid({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  );

  if (!entries.length) {
    return <p className="text-xs text-neutral-500">No additional signal details recorded.</p>;
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-xl border border-neutral-150 bg-neutral-50 p-3.5">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{humanizeKey(key)}</dt>
          <dd className="mt-1.5">{renderMetadataValue(key, value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function renderMetadataValue(key: string, value: unknown) {
  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-sm text-neutral-400">None</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, index) => {
          const text = typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item);
          return (
            <span
              key={`${text}-${index}`}
              className="rounded-full bg-white border border-neutral-200 px-2 py-0.5 text-[11px] font-semibold text-neutral-700"
            >
              {text}
            </span>
          );
        })}
      </div>
    );
  }

  if (key === 'window' && typeof value === 'string') {
    return <span className="text-sm font-semibold text-neutral-800">{WINDOW_LABELS[value] ?? value}</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="text-sm font-semibold text-neutral-800">{value ? 'Yes' : 'No'}</span>;
  }

  if (typeof value === 'object') {
    return (
      <pre className="overflow-x-auto rounded-lg bg-white border border-neutral-200 p-2 text-[10px] font-mono leading-relaxed text-neutral-600">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span className="text-sm font-semibold text-neutral-800 break-words">{String(value)}</span>;
}

const INACTIVE_MEMBER_STATUSES = new Set(['SUSPENDED', 'BANNED', 'DELETED']);

export default function AdminFraudPage() {
  const memberRequest = useMemberRequest();
  const [events, setEvents] = useState<FraudEvent[]>([]);
  const [counts, setCounts] = useState<FraudStatusCounts>({ OPEN: 0, REVIEWED: 0, DISMISSED: 0 });
  const [rules, setRules] = useState<FraudRuleOption[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('OPEN');
  const [ruleFilter, setRuleFilter] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (ruleFilter) params.set('rule', ruleFilter);
    const suffix = params.toString();
    const result = await memberRequest(`/api/admin/fraud/events${suffix ? `?${suffix}` : ''}`);
    if (result.ok) {
      const data = result.data as {
        events?: FraudEvent[];
        counts?: FraudStatusCounts;
        rules?: FraudRuleOption[];
      };
      setEvents(data.events ?? []);
      if (data.counts) setCounts(data.counts);
      if (data.rules) setRules(data.rules);
      setMessage('');
    } else {
      setMessage(result.message);
    }
    setLoading(false);
  }, [memberRequest, statusFilter, ruleFilter]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  async function reviewEvent(eventId: string, status: 'REVIEWED' | 'DISMISSED') {
    setBusyId(eventId);
    const result = await memberRequest(`/api/admin/fraud/events/${eventId}`, {
      method: 'PATCH',
      body: { status },
    });
    setMessage(result.ok ? `Fraud event ${status.toLowerCase()}.` : result.message);
    setBusyId('');
    if (result.ok) await loadEvents();
  }

  async function suspendMember(event: FraudEvent) {
    const memberId = event.affectedMember?.id;
    if (!memberId) return;
    const name = event.affectedMember?.profile?.firstName ?? event.affectedMember?.email ?? 'this member';
    if (!window.confirm(`Suspend ${name}? They will lose access until reactivated.`)) return;
    setBusyId(event._id);
    const result = await memberRequest(`/api/admin/users/${memberId}/status`, {
      method: 'PATCH',
      body: { status: 'SUSPENDED' },
    });
    setMessage(result.ok ? `${name} has been suspended.` : result.message);
    setBusyId('');
    if (result.ok) await loadEvents();
  }

  function tabCount(key: StatusFilter) {
    if (key === 'ALL') return counts.OPEN + counts.REVIEWED + counts.DISMISSED;
    return counts[key];
  }

  return (
    <AdminShell
      title="Fraud Detection Console"
      subtitle="Review automated rule-based abuse signals, velocity triggers, and anomaly indicators."
    >
      {message && (
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-[#A10E4D]" />
          <span>{message}</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-[#A10E4D] text-white shadow-sm'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {tabCount(tab.key)}
                </span>
              </button>
            );
          })}
        </div>

        <select
          value={ruleFilter}
          onChange={(changeEvent) => setRuleFilter(changeEvent.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm"
        >
          <option value="">All rules</option>
          {rules.map((option) => (
            <option key={option.rule} value={option.rule}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        {events.map((event) => {
          const member = event.affectedMember;
          const memberName = member?.profile?.firstName ?? member?.email ?? 'Unknown';
          const memberQuery = member?.profile?.displayId ?? member?.email ?? '';
          const canSuspend = Boolean(member?.id) && !INACTIVE_MEMBER_STATUSES.has((member?.status ?? '').toUpperCase());
          const severityStyle = SEVERITY_STYLES[event.severity?.toUpperCase()] ?? SEVERITY_STYLES.LOW;
          const isBusy = busyId === event._id;
          return (
            <article key={event._id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-800">{event.ruleLabel ?? event.rule}</h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${severityStyle}`}>
                        {event.severity} Severity
                      </span>
                      <span className="text-neutral-400 font-semibold">·</span>
                      <span className="text-neutral-500">Score: {event.score}</span>
                      <span className="text-neutral-400 font-semibold">·</span>
                      <AdminStatusBadge status={event.status} />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-semibold">
                  Logged: {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>

              {member && (
                <div className="grid gap-3 rounded-xl border border-neutral-150 bg-neutral-50 p-4 text-xs text-neutral-600 sm:grid-cols-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Affected member</div>
                    <div className="mt-1 font-semibold text-neutral-800">{memberName}</div>
                    <div>{member.profile?.displayId ?? member.email ?? ''}</div>
                    {member.status && (
                      <div className="mt-1.5">
                        <AdminStatusBadge status={member.status} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Profile context</div>
                    <div className="mt-1">
                      {[member.profile?.city, member.profile?.state].filter(Boolean).join(', ') || 'No profile context'}
                    </div>
                    {memberQuery && (
                      <Link
                        href={`/admin/users?q=${encodeURIComponent(memberQuery)}`}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#A10E4D] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View member
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {(event.evidence ?? event.metadata) && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Signal details</h3>
                  <MetadataGrid data={(event.evidence ?? event.metadata) as Record<string, unknown>} />
                </div>
              )}

              {event.reviewReason && (
                <div className="rounded-xl border border-neutral-150 bg-neutral-50 p-4 text-xs text-neutral-600">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Review note</div>
                  <div className="mt-1">{event.reviewReason}</div>
                </div>
              )}

              {(event.status === 'OPEN' || canSuspend) && (
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  {canSuspend && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void suspendMember(event)}
                      className="mr-auto inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700 shadow-sm transition disabled:opacity-50"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Suspend member
                    </button>
                  )}
                  {event.status === 'OPEN' && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void reviewEvent(event._id, 'DISMISSED')}
                        className="rounded-xl border border-neutral-250 bg-white hover:bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-700 shadow-sm transition disabled:opacity-50"
                      >
                        Dismiss Signal
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void reviewEvent(event._id, 'REVIEWED')}
                        className="rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                      >
                        Mark Reviewed
                      </button>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {!loading && !events.length && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center bg-white">
            <span className="text-3xl">🛡️</span>
            <h3 className="mt-3 text-sm font-bold text-neutral-800">Clear Ledger</h3>
            <p className="mt-1 text-xs text-neutral-450">No fraud signals match the current filters.</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
