'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminDataTable } from '../components/admin-data-table';
import type { Column } from '../components/admin-data-table';
import {
  AlertCircle,
  Eye,
  X,
  Filter,
  History,
  Settings,
  User,
  Clock,
  Hash,
  Target,
  Database,
  Copy,
  Check,
  CalendarClock,
  Shield,
} from 'lucide-react';

interface AuditLogItem {
  _id: string;
  actorId?: string;
  actorName?: string | null;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

/** Turn UPDATE_STATUS / approveMedia / refund_payment into "Update Status". */
function humanize(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-.]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) =>
      word.length <= 2 && word === word.toUpperCase()
        ? word // keep short acronyms like ID, OK
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ');
}

/** Color-coded category derived from the action verb. */
function actionCategory(action: string): { label: string; className: string } {
  const a = action.toUpperCase();
  if (/(CREATE|ADD|PROMOTE|APPROVE|GRANT|VERIFY)/.test(a))
    return { label: 'Create / Approve', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (/(DELETE|REMOVE|REJECT|REVOKE|BAN|REFUND)/.test(a))
    return { label: 'Remove / Reject', className: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (/(UPDATE|EDIT|CHANGE|STATUS)/.test(a))
    return { label: 'Update', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'System', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  const abs = Math.abs(diffSec);
  const steps: { limit: number; div: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { limit: 60, div: 1, unit: 'second' },
    { limit: 3600, div: 60, unit: 'minute' },
    { limit: 86400, div: 3600, unit: 'hour' },
    { limit: 604800, div: 86400, unit: 'day' },
    { limit: 2629800, div: 604800, unit: 'week' },
    { limit: 31557600, div: 2629800, unit: 'month' },
    { limit: Infinity, div: 31557600, unit: 'year' },
  ];
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const step of steps) {
    if (abs < step.limit) {
      return rtf.format(-Math.round(diffSec / step.div), step.unit);
    }
  }
  return new Date(iso).toLocaleString();
}

function looksLikeDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
}

/** Render a single metadata value in a human-readable way (recursive for objects/arrays). */
function MetadataValue({ value }: { value: unknown }): ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-neutral-400 italic">—</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          value ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'
        }`}
      >
        {value ? 'Yes' : 'No'}
      </span>
    );
  }
  if (typeof value === 'number') {
    return <span className="font-semibold text-neutral-800 tabular-nums">{value.toLocaleString()}</span>;
  }
  if (typeof value === 'string') {
    if (looksLikeDate(value)) {
      return <span className="font-semibold text-neutral-800">{new Date(value).toLocaleString()}</span>;
    }
    return <span className="font-semibold text-neutral-800 break-words">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-neutral-400 italic">empty</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, idx) => (
          <span
            key={idx}
            className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[11px] font-medium text-neutral-700"
          >
            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return (
      <div className="mt-1 space-y-1.5 rounded-lg border border-neutral-150 bg-neutral-50/60 p-2.5">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{humanize(k)}</span>
            <div className="text-right text-[11px]">
              <MetadataValue value={v} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <span className="font-semibold text-neutral-800">{String(value)}</span>;
}

/** Reusable copyable ID chip. */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">{label}</span>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="group inline-flex max-w-full items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] font-mono text-neutral-700 hover:bg-neutral-100 transition"
        title="Click to copy"
      >
        <span className="truncate">{value}</span>
        {copied ? (
          <Check className="h-3 w-3 shrink-0 text-emerald-600" />
        ) : (
          <Copy className="h-3 w-3 shrink-0 text-neutral-400 group-hover:text-neutral-600" />
        )}
      </button>
    </div>
  );
}

export default function AdminAuditLogsPage() {
  const memberRequest = useMemberRequest();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail modal state
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (action.trim()) params.set('action', action.trim());
    if (entityType.trim()) params.set('entityType', entityType.trim());
    const result = await memberRequest(`/api/admin/audit-logs?${params.toString()}`);
    if (result.ok) {
      setLogs((result.data as { logs?: AuditLogItem[] }).logs ?? []);
    } else {
      setMessage(result.message);
    }
    setLoading(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load();
  }

  useEffect(() => {
    void load();
  }, []);

  // Close modal on Escape
  useEffect(() => {
    if (!selectedLog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedLog(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedLog]);

  const columns: Column<AuditLogItem>[] = [
    {
      header: 'System Action',
      accessor: (log) => (
        <span className="font-extrabold text-[#2F2F2F] tracking-wide flex items-center gap-1.5">
          <Settings className="h-3.5 w-3.5 text-neutral-400" />
          {humanize(log.action)}
        </span>
      ),
      sortKey: 'action',
    },
    {
      header: 'Operator Name',
      accessor: (log) => (
        <span className="flex items-center gap-1.5 font-bold text-neutral-700">
          <User className="h-3.5 w-3.5 text-neutral-400" />
          {log.actorName ?? 'System'}
        </span>
      ),
      sortKey: 'actorName',
    },
    {
      header: 'Operator Role',
      accessor: (log) => (
        <div>
          <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[9px] font-extrabold text-neutral-600 uppercase tracking-wider">
            {log.actorRole ?? 'SYSTEM'}
          </span>
          {log.actorId && (
            <code className="ml-2 font-mono text-[10px] text-neutral-450 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-150">
              {log.actorId.slice(-8).toUpperCase()}
            </code>
          )}
        </div>
      ),
      sortKey: 'actorRole',
    },
    {
      header: 'Timestamp',
      accessor: (log) => <span className="text-neutral-450 text-xs font-medium">{new Date(log.createdAt).toLocaleString()}</span>,
      sortKey: 'createdAt',
    },
    {
      header: 'Inspect',
      accessor: (log) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 bg-white transition"
          type="button"
        >
          <Eye className="h-3.5 w-3.5 text-neutral-500" />
          <span>View Info</span>
        </button>
      ),
      className: 'text-right',
    },
  ];

  const category = selectedLog ? actionCategory(selectedLog.action) : null;
  const metadataEntries = selectedLog?.metadata ? Object.entries(selectedLog.metadata) : [];

  return (
    <AdminShell
      title="System Audit Logs"
      subtitle="Immutable accountability ledger tracking all staff reviews, status updates, promotions, and refunds."
    >
      {/* FILTER SEARCH TOOLBAR */}
      <form
        onSubmit={submit}
        className="grid gap-3 rounded-2xl border border-[#2F2F2F]/10 bg-white p-5 shadow-sm md:grid-cols-[1fr_180px_auto]"
      >
        <div className="relative">
          <input
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="Filter by action type (e.g. UPDATE_STATUS, APPROVE_MEDIA)"
            className="h-9 w-full rounded-xl border border-neutral-250 bg-neutral-50 px-4 text-xs placeholder-neutral-400 outline-none focus:border-[#A10E4D] focus:bg-white transition"
          />
        </div>
        <div className="relative">
          <input
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            placeholder="Entity target (e.g. User, Page)"
            className="h-9 w-full rounded-xl border border-neutral-250 bg-neutral-50 px-4 text-xs placeholder-neutral-400 outline-none focus:border-[#A10E4D] focus:bg-white transition"
          />
        </div>
        <button className="h-9 rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-6 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Apply Filter</span>
        </button>
      </form>

      {message && (
        <div className="rounded-xl bg-[#FFF9F5] border border-[#D4A04C]/35 p-3.5 text-xs font-semibold text-neutral-800 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 text-[#A10E4D]" />
          <span>{message}</span>
        </div>
      )}

      {/* DATA TABLE */}
      <AdminDataTable
        data={logs}
        columns={columns}
        loading={loading}
        emptyTitle="No audit entries found"
        emptyDescription="Please adjust filters or check log records later."
      />

      {/* DETAIL MODAL */}
      {selectedLog && category && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <button
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
            aria-label="Close Dialog"
          />

          {/* Modal */}
          <div className="relative z-50 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 bg-gradient-to-br from-[#FFF9F5] to-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#A10E4D]/10 text-[#A10E4D]">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 leading-tight">
                    {humanize(selectedLog.action)}
                  </h3>
                  <span
                    className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${category.className}`}
                  >
                    {category.label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-neutral-200 p-1.5 text-neutral-500 hover:bg-neutral-50 transition"
                type="button"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* Plain-language summary */}
              <p className="rounded-xl border border-neutral-150 bg-neutral-50/70 p-3 text-xs leading-relaxed text-neutral-700">
                <span className="font-bold text-neutral-900">{selectedLog.actorName ?? 'System'}</span>
                {selectedLog.actorRole ? ` (${humanize(selectedLog.actorRole)})` : ''} performed{' '}
                <span className="font-bold text-[#A10E4D]">{humanize(selectedLog.action)}</span>
                {selectedLog.targetType ? (
                  <>
                    {' '}
                    on a <span className="font-bold text-neutral-900">{humanize(selectedLog.targetType)}</span>
                  </>
                ) : (
                  ''
                )}{' '}
                <span className="text-neutral-500">({relativeTime(selectedLog.createdAt)})</span>.
              </p>

              {/* Actor section */}
              <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <User className="h-3.5 w-3.5" /> Operator
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">Name</span>
                    <span className="font-extrabold text-[#2F2F2F]">{selectedLog.actorName ?? 'System'}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">Role</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-extrabold text-neutral-700 uppercase tracking-wider">
                      <Shield className="h-3 w-3 text-neutral-500" />
                      {selectedLog.actorRole ?? 'SYSTEM'}
                    </span>
                  </div>
                  {selectedLog.actorId && (
                    <div className="col-span-2">
                      <CopyField label="Operator ID" value={selectedLog.actorId} />
                    </div>
                  )}
                </div>
              </section>

              {/* Target section */}
              <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <Target className="h-3.5 w-3.5" /> Target Entity
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">Type</span>
                    <span className="font-bold text-[#2F2F2F]">
                      {selectedLog.targetType ? humanize(selectedLog.targetType) : 'None'}
                    </span>
                  </div>
                  {selectedLog.targetId ? (
                    <div className="col-span-2">
                      <CopyField label="Target ID" value={selectedLog.targetId} />
                    </div>
                  ) : (
                    <div>
                      <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">ID</span>
                      <span className="text-neutral-400 italic text-xs">None</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Timing section */}
              <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <Clock className="h-3.5 w-3.5" /> Timing
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">When</span>
                    <span className="font-semibold text-neutral-700 capitalize">{relativeTime(selectedLog.createdAt)}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1 flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" /> Exact
                    </span>
                    <span className="font-semibold text-neutral-700 text-[11px]">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </section>

              {/* Metadata section — readable key/value, no raw JSON */}
              <section>
                <h4 className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" /> Additional Details
                  </span>
                  {metadataEntries.length > 0 && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] text-neutral-500">
                      {metadataEntries.length} {metadataEntries.length === 1 ? 'field' : 'fields'}
                    </span>
                  )}
                </h4>
                {metadataEntries.length > 0 ? (
                  <dl className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 overflow-hidden">
                    {metadataEntries.map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between gap-4 px-3.5 py-2.5 odd:bg-neutral-50/40">
                        <dt className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 pt-0.5">
                          <Hash className="h-3 w-3 text-neutral-300" />
                          {humanize(key)}
                        </dt>
                        <dd className="max-w-[60%] text-right text-xs">
                          <MetadataValue value={value} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-4 text-center text-xs text-neutral-400">
                    No additional details were recorded for this action.
                  </div>
                )}
              </section>

              {/* Log reference */}
              <section className="border-t border-neutral-100 pt-4">
                <CopyField label="Log Reference ID" value={selectedLog._id} />
              </section>
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-100 bg-neutral-50/50 p-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
