'use client';

import { useEffect, useState, type FormEvent } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminDataTable } from '../components/admin-data-table';
import type { Column } from '../components/admin-data-table';
import { AlertCircle, Eye, X } from 'lucide-react';

interface AuditLogItem {
  _id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export default function AdminAuditLogsPage() {
  const memberRequest = useMemberRequest();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail Modal state
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

  const columns: Column<AuditLogItem>[] = [
    {
      header: 'System Action',
      accessor: (log) => <span className="font-bold text-neutral-900">{log.action}</span>,
    },
    {
      header: 'Actor / Operator',
      accessor: (log) => (
        <div>
          <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
            {log.actorRole ?? 'SYSTEM'}
          </span>
          {log.actorId && (
            <code className="ml-2 font-mono text-xs text-neutral-500 bg-neutral-50 px-1 py-0.5 rounded border border-neutral-150">
              {log.actorId.slice(-8).toUpperCase()}
            </code>
          )}
        </div>
      ),
    },
    {
      header: 'Target Entity',
      accessor: (log) => (
        <div>
          <span className="text-xs font-semibold text-neutral-700">{log.targetType ?? 'NONE'}</span>
          {log.targetId && (
            <code className="ml-2 font-mono text-xs text-neutral-500 bg-neutral-50 px-1 py-0.5 rounded border border-neutral-150">
              {log.targetId.slice(-8).toUpperCase()}
            </code>
          )}
        </div>
      ),
    },
    {
      header: 'Timestamp',
      accessor: (log) => <span className="text-neutral-450">{new Date(log.createdAt).toLocaleString()}</span>,
    },
    {
      header: 'Inspect',
      accessor: (log) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="inline-flex h-8 items-center gap-1 rounded-xl border border-neutral-250 px-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 bg-white transition shadow-sm"
          type="button"
        >
          <Eye className="h-3.5 w-3.5 text-neutral-500" />
          <span>Inspect</span>
        </button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminShell
      title="System Audit Logs"
      subtitle="Audit operations, status adjustments, roles promotions, CMS changes, and refunds."
    >
      {/* FILTER BAR */}
      <form
        onSubmit={submit}
        className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_180px_auto]"
      >
        <input
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="Filter by action (e.g. UPDATE_STATUS, DELETE_PAGE)"
          className="h-11 rounded-xl border border-neutral-250 bg-white px-4 text-sm placeholder-neutral-450 outline-none focus:border-[#A10E4D]"
        />
        <input
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          placeholder="Entity type (e.g. User, Page)"
          className="h-11 rounded-xl border border-neutral-250 bg-white px-4 text-sm placeholder-neutral-450 outline-none focus:border-[#A10E4D]"
        />
        <button className="h-11 rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-6 text-sm font-bold text-white shadow-sm transition">
          Search Logs
        </button>
      </form>

      {message && (
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
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

      {/* DETAIL MODAL DRAWER */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
            aria-label="Close Dialog"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200 space-y-4">
            <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Inspect Audit Details
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Log ID: <span className="font-mono text-[10px] font-bold text-neutral-600">{selectedLog._id}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-neutral-200 p-1 text-neutral-500 hover:bg-neutral-50"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Action</span>
                <span className="font-semibold text-neutral-800">{selectedLog.action}</span>
              </div>
              <div>
                <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Actor ID</span>
                <code className="font-mono text-neutral-600 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-150">
                  {selectedLog.actorId ?? 'SYSTEM'}
                </code>
              </div>
              <div>
                <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Target Type</span>
                <span className="font-semibold text-neutral-800">{selectedLog.targetType ?? 'None'}</span>
              </div>
              <div>
                <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Target ID</span>
                <code className="font-mono text-neutral-600 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-150">
                  {selectedLog.targetId ?? 'None'}
                </code>
              </div>
            </div>

            <div>
              <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-1.5">Action Metadata</span>
              <pre className="max-h-40 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-[10px] font-mono leading-relaxed text-neutral-600">
                {JSON.stringify(selectedLog.metadata || { note: 'No metadata snapshot attached.' }, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-neutral-250 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 bg-white"
                type="button"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
